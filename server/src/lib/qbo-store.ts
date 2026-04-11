export type { QBOConnectionRecord } from './qbo-store-types';
import type { QBOConnectionRecord } from './qbo-store-types';
import * as memory from './qbo-store-memory';
import * as supa from './qbo-store-supabase';

/** When set, QuickBooks OAuth state and tokens persist across Vercel serverless instances. */
export function useSupabaseStore(): boolean {
  return !!(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export async function createPendingOAuthState(userId: string): Promise<string> {
  return useSupabaseStore()
    ? supa.createPendingOAuthState(userId)
    : Promise.resolve(memory.createPendingOAuthState(userId));
}

export async function consumePendingOAuthState(state: string | undefined): Promise<string | null> {
  return useSupabaseStore()
    ? supa.consumePendingOAuthState(state)
    : Promise.resolve(memory.consumePendingOAuthState(state));
}

export async function upsertConnection(input: {
  userId: string;
  realmId: string;
  companyName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiresAt: number;
  environment: string;
}): Promise<QBOConnectionRecord> {
  return useSupabaseStore() ? supa.upsertConnection(input) : Promise.resolve(memory.upsertConnection(input));
}

export async function listConnectionsForUser(userId: string): Promise<QBOConnectionRecord[]> {
  return useSupabaseStore()
    ? supa.listConnectionsForUser(userId)
    : Promise.resolve(memory.listConnectionsForUser(userId));
}

export async function deleteConnection(userId: string, connectionId: string): Promise<boolean> {
  return useSupabaseStore()
    ? supa.deleteConnection(userId, connectionId)
    : Promise.resolve(memory.deleteConnection(userId, connectionId));
}

export async function getConnection(
  userId: string,
  connectionId: string,
): Promise<QBOConnectionRecord | undefined> {
  return useSupabaseStore()
    ? supa.getConnection(userId, connectionId)
    : Promise.resolve(memory.getConnection(userId, connectionId));
}

export async function updateConnectionTokens(
  userId: string,
  connectionId: string,
  patch: Partial<Pick<QBOConnectionRecord, 'accessTokenEnc' | 'refreshTokenEnc' | 'tokenExpiresAt'>>,
): Promise<boolean> {
  return useSupabaseStore()
    ? supa.updateConnectionTokens(userId, connectionId, patch)
    : Promise.resolve(memory.updateConnectionTokens(userId, connectionId, patch));
}
