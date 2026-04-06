import crypto from 'crypto';

/** One linked QuickBooks Online company per row; a user may have many. */
export type QBOConnectionRecord = {
  id: string;
  userId: string;
  realmId: string;
  companyName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiresAt: number;
  environment: string;
  createdAt: string;
};

type PendingOAuth = { userId: string; expires: number };

const connections: QBOConnectionRecord[] = [];
const pendingOAuth = new Map<string, PendingOAuth>();

const PENDING_TTL_MS = 15 * 60 * 1000;

export function createPendingOAuthState(userId: string): string {
  const state = crypto.randomUUID();
  pendingOAuth.set(state, { userId, expires: Date.now() + PENDING_TTL_MS });
  return state;
}

export function consumePendingOAuthState(state: string | undefined): string | null {
  if (!state) return null;
  const p = pendingOAuth.get(state);
  pendingOAuth.delete(state);
  if (!p || p.expires < Date.now()) return null;
  return p.userId;
}

export function upsertConnection(input: {
  userId: string;
  realmId: string;
  companyName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiresAt: number;
  environment: string;
}): QBOConnectionRecord {
  const idx = connections.findIndex((c) => c.userId === input.userId && c.realmId === input.realmId);
  const now = new Date().toISOString();
  if (idx >= 0) {
    const prev = connections[idx]!;
    const updated: QBOConnectionRecord = {
      ...prev,
      companyName: input.companyName ?? prev.companyName,
      accessTokenEnc: input.accessTokenEnc,
      refreshTokenEnc: input.refreshTokenEnc,
      tokenExpiresAt: input.tokenExpiresAt,
      environment: input.environment,
    };
    connections[idx] = updated;
    return updated;
  }
  const row: QBOConnectionRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    realmId: input.realmId,
    companyName: input.companyName,
    accessTokenEnc: input.accessTokenEnc,
    refreshTokenEnc: input.refreshTokenEnc,
    tokenExpiresAt: input.tokenExpiresAt,
    environment: input.environment,
    createdAt: now,
  };
  connections.push(row);
  return row;
}

export function listConnectionsForUser(userId: string): QBOConnectionRecord[] {
  return connections.filter((c) => c.userId === userId);
}

export function deleteConnection(userId: string, connectionId: string): boolean {
  const i = connections.findIndex((c) => c.id === connectionId && c.userId === userId);
  if (i < 0) return false;
  connections.splice(i, 1);
  return true;
}

export function getConnection(userId: string, connectionId: string): QBOConnectionRecord | undefined {
  return connections.find((c) => c.id === connectionId && c.userId === userId);
}

export function updateConnectionTokens(
  userId: string,
  connectionId: string,
  patch: Partial<Pick<QBOConnectionRecord, 'accessTokenEnc' | 'refreshTokenEnc' | 'tokenExpiresAt'>>,
): boolean {
  const c = getConnection(userId, connectionId);
  if (!c) return false;
  Object.assign(c, patch);
  return true;
}
