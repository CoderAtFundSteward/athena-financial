-- Run in Supabase SQL Editor (or supabase db push) before enabling Vercel + QuickBooks.
-- Server uses SUPABASE_SERVICE_ROLE_KEY only (never expose to the browser).

create table if not exists public.qbo_oauth_pending (
  state text primary key,
  user_id text not null,
  expires_at bigint not null
);

create table if not exists public.qbo_connections (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  realm_id text not null,
  company_name text,
  access_token_enc text not null,
  refresh_token_enc text not null,
  token_expires_at bigint not null,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  unique (user_id, realm_id)
);

create index if not exists idx_qbo_connections_user_id on public.qbo_connections (user_id);

alter table public.qbo_oauth_pending enable row level security;
alter table public.qbo_connections enable row level security;

-- Intentionally no GRANT for anon/authenticated: backend uses service role, which bypasses RLS.
