import OAuthClient from 'intuit-oauth';
import { decrypt, encrypt } from './crypto';
import type { QBOConnectionRecord } from './qbo-store-types';
import { updateConnectionTokens } from './qbo-store';

function makeClient() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID || process.env.QB_CLIENT_ID || '';
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || process.env.QB_CLIENT_SECRET || '';
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT ||
    process.env.QB_ENVIRONMENT ||
    'sandbox') as string;
  const redirectUri =
    process.env.QB_REDIRECT_URI ||
    'http://localhost:3002/api/integrations/quickbooks/callback';
  return new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri,
  });
}

const REFRESH_BUFFER_MS = 60_000;

/** Returns a usable access token, refreshing and persisting if close to expiry. */
export async function getValidAccessToken(conn: QBOConnectionRecord): Promise<string> {
  if (Date.now() < conn.tokenExpiresAt - REFRESH_BUFFER_MS) {
    return decrypt(conn.accessTokenEnc);
  }

  const oauthClient = makeClient();
  oauthClient.setToken({
    access_token: decrypt(conn.accessTokenEnc),
    refresh_token: decrypt(conn.refreshTokenEnc),
  });

  const authResponse = await oauthClient.refresh();
  const token = authResponse.getJson() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const accessTokenEnc = encrypt(token.access_token);
  const refreshTokenEnc = token.refresh_token
    ? encrypt(token.refresh_token)
    : conn.refreshTokenEnc;
  const tokenExpiresAt = Date.now() + token.expires_in * 1000;

  await updateConnectionTokens(conn.userId, conn.id, {
    accessTokenEnc,
    refreshTokenEnc,
    tokenExpiresAt,
  });

  return token.access_token;
}
