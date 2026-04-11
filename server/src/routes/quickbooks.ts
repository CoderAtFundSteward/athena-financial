import { Router, Request, Response } from 'express';
import OAuthClient from 'intuit-oauth';
import { encrypt, decrypt } from '../lib/crypto';
import {
  createPendingOAuthState,
  consumePendingOAuthState,
  upsertConnection,
  listConnectionsForUser,
  deleteConnection,
  getConnection,
} from '../lib/qbo-store';
import { fetchQuickBooksCompanyName } from '../lib/qbo-api';
import { queryAccountsSample } from '../lib/qbo-query';

export const quickbooksRouter = Router();

function routeParamId(p: string | string[] | undefined): string {
  if (typeof p === 'string') return p;
  if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
  return '';
}

function getOAuthConfig() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID || process.env.QB_CLIENT_ID || '';
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || process.env.QB_CLIENT_SECRET || '';
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT ||
    process.env.QB_ENVIRONMENT ||
    'sandbox') as string;
  const redirectUri =
    process.env.QB_REDIRECT_URI ||
    'http://localhost:3002/api/integrations/quickbooks/callback';
  return { clientId, clientSecret, environment, redirectUri };
}

function makeOAuthClient() {
  const { clientId, clientSecret, environment, redirectUri } = getOAuthConfig();
  return new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri,
  });
}

function fullRequestUrl(req: Request): string {
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0]!.trim();
  const host = req.get('host') || `localhost:${process.env.PORT || 3002}`;
  return `${proto}://${host}${req.originalUrl}`;
}

/** Start OAuth: returns Intuit authorization URL (client opens in browser). */
quickbooksRouter.get('/authorize', async (req: Request, res: Response) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  const { clientId, clientSecret } = getOAuthConfig();
  if (!clientId || !clientSecret) {
    res.status(503).json({
      error: 'QuickBooks OAuth is not configured',
      hint: 'Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET in .env',
    });
    return;
  }
  if (!userId) {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }

  try {
    const state = await createPendingOAuthState(userId);
    const oauthClient = makeOAuthClient();
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state,
    });
    res.json({ authUri });
  } catch (e) {
    console.error('QBO authorize error:', e);
    res.status(500).json({ error: 'Failed to start OAuth state' });
  }
});

/** Intuit redirects here after user approves. */
quickbooksRouter.get('/callback', async (req: Request, res: Response) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5280';
  const redirectError = (code: string) => {
    res.redirect(`${clientUrl}/app/connectors?qb_error=${encodeURIComponent(code)}`);
  };

  try {
    const userId = await consumePendingOAuthState(req.query.state as string | undefined);
    if (!userId) {
      redirectError('invalid_oauth_state');
      return;
    }

    const oauthClient = makeOAuthClient();
    const url = fullRequestUrl(req);
    const authResponse = await oauthClient.createToken(url);
    const token = authResponse.getJson() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    const realmId = req.query.realmId as string;
    if (!realmId) {
      redirectError('missing_realm');
      return;
    }

    const { environment } = getOAuthConfig();
    let companyName: string | null = null;
    try {
      companyName = await fetchQuickBooksCompanyName(realmId, token.access_token, environment);
    } catch {
      companyName = null;
    }

    await upsertConnection({
      userId,
      realmId,
      companyName,
      accessTokenEnc: encrypt(token.access_token),
      refreshTokenEnc: encrypt(token.refresh_token),
      tokenExpiresAt: Date.now() + token.expires_in * 1000,
      environment,
    });

    res.redirect(`${clientUrl}/app/connectors?qb_connected=1`);
  } catch (e) {
    console.error('QuickBooks OAuth callback error:', e);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5280';
    res.redirect(`${clientUrl}/app/connectors?qb_error=token_exchange_failed`);
  }
});

/** List connection profiles for a user (no secrets). */
quickbooksRouter.get('/connections', async (req: Request, res: Response) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!userId) {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }
  try {
    const rows = await listConnectionsForUser(userId);
    res.json({
      connections: rows.map((c) => ({
        id: c.id,
        realmId: c.realmId,
        companyName: c.companyName,
        environment: c.environment,
        createdAt: c.createdAt,
      })),
    });
  } catch (e) {
    console.error('QBO list connections error:', e);
    res.status(500).json({ error: 'Failed to list connections' });
  }
});

/** Sample read: chart of accounts (validates token + realm). */
quickbooksRouter.get('/connections/:id/accounts', async (req: Request, res: Response) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  if (!userId) {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }
  const conn = await getConnection(userId, routeParamId(req.params.id));
  if (!conn) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }
  try {
    const { accounts } = await queryAccountsSample(conn, 50);
    res.json({ realmId: conn.realmId, companyName: conn.companyName, accounts });
  } catch (e) {
    console.error('QBO accounts read error:', e);
    res.status(502).json({
      error: 'Failed to read accounts from QuickBooks',
      detail: e instanceof Error ? e.message : 'unknown',
    });
  }
});

/** Remove one connection profile. */
quickbooksRouter.delete('/connections/:id', async (req: Request, res: Response) => {
  const userId =
    (typeof req.query.userId === 'string' && req.query.userId.trim()) ||
    (typeof req.body?.userId === 'string' && req.body.userId.trim()) ||
    '';
  if (!userId) {
    res.status(400).json({ error: 'userId is required (query or JSON body)' });
    return;
  }
  try {
    const ok = await deleteConnection(userId, routeParamId(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }
    res.json({ deleted: true });
  } catch (e) {
    console.error('QBO delete connection error:', e);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});
