import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { QBOConnectionRecord } from './qbo-store-types';

const PENDING_TTL_MS = 15 * 60 * 1000;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing');
  }
  client = createClient(url, key);
  return client;
}

function mapConnectionRow(row: {
  id: string;
  user_id: string;
  realm_id: string;
  company_name: string | null;
  access_token_enc: string;
  refresh_token_enc: string;
  token_expires_at: number;
  environment: string;
  created_at: string;
}): QBOConnectionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    realmId: row.realm_id,
    companyName: row.company_name,
    accessTokenEnc: row.access_token_enc,
    refreshTokenEnc: row.refresh_token_enc,
    tokenExpiresAt: Number(row.token_expires_at),
    environment: row.environment,
    createdAt: row.created_at,
  };
}

export async function createPendingOAuthState(userId: string): Promise<string> {
  const state = crypto.randomUUID();
  const expiresAt = Date.now() + PENDING_TTL_MS;
  const { error } = await getClient().from('qbo_oauth_pending').insert({
    state,
    user_id: userId,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return state;
}

export async function consumePendingOAuthState(state: string | undefined): Promise<string | null> {
  if (!state) return null;
  const supa = getClient();
  const { data, error } = await supa
    .from('qbo_oauth_pending')
    .select('user_id, expires_at')
    .eq('state', state)
    .maybeSingle();
  if (error || !data) return null;
  await supa.from('qbo_oauth_pending').delete().eq('state', state);
  if (Number(data.expires_at) < Date.now()) return null;
  return data.user_id as string;
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
  const supa = getClient();
  const { data: existing } = await supa
    .from('qbo_connections')
    .select('id, created_at')
    .eq('user_id', input.userId)
    .eq('realm_id', input.realmId)
    .maybeSingle();

  const id = (existing as { id: string; created_at: string } | null)?.id ?? crypto.randomUUID();
  const createdAt =
    (existing as { id: string; created_at: string } | null)?.created_at ?? new Date().toISOString();

  const payload = {
    id,
    user_id: input.userId,
    realm_id: input.realmId,
    company_name: input.companyName,
    access_token_enc: input.accessTokenEnc,
    refresh_token_enc: input.refreshTokenEnc,
    token_expires_at: input.tokenExpiresAt,
    environment: input.environment,
    created_at: createdAt,
  };

  if (existing) {
    const { error } = await supa.from('qbo_connections').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supa.from('qbo_connections').insert(payload);
    if (error) throw error;
  }

  return {
    id,
    userId: input.userId,
    realmId: input.realmId,
    companyName: input.companyName,
    accessTokenEnc: input.accessTokenEnc,
    refreshTokenEnc: input.refreshTokenEnc,
    tokenExpiresAt: input.tokenExpiresAt,
    environment: input.environment,
    createdAt,
  };
}

export async function listConnectionsForUser(userId: string): Promise<QBOConnectionRecord[]> {
  const { data, error } = await getClient()
    .from('qbo_connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapConnectionRow(r as Parameters<typeof mapConnectionRow>[0]));
}

export async function deleteConnection(userId: string, connectionId: string): Promise<boolean> {
  const { data, error } = await getClient()
    .from('qbo_connections')
    .delete()
    .eq('user_id', userId)
    .eq('id', connectionId)
    .select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function getConnection(
  userId: string,
  connectionId: string,
): Promise<QBOConnectionRecord | undefined> {
  const { data, error } = await getClient()
    .from('qbo_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('id', connectionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapConnectionRow(data as Parameters<typeof mapConnectionRow>[0]);
}

export async function updateConnectionTokens(
  userId: string,
  connectionId: string,
  patch: Partial<Pick<QBOConnectionRecord, 'accessTokenEnc' | 'refreshTokenEnc' | 'tokenExpiresAt'>>,
): Promise<boolean> {
  const updates: Record<string, unknown> = {};
  if (patch.accessTokenEnc !== undefined) updates.access_token_enc = patch.accessTokenEnc;
  if (patch.refreshTokenEnc !== undefined) updates.refresh_token_enc = patch.refreshTokenEnc;
  if (patch.tokenExpiresAt !== undefined) updates.token_expires_at = patch.tokenExpiresAt;
  if (Object.keys(updates).length === 0) return true;

  const { data, error } = await getClient()
    .from('qbo_connections')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', connectionId)
    .select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
