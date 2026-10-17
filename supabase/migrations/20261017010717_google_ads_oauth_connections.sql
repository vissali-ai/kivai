-- Kivai Google Ads OAuth - conexão somente leitura em aplicação.
-- Migração aditiva. NÃO aplicar em produção antes do QA.
-- RLS sem políticas públicas: acesso apenas por serviço servidor Kivai autenticado.

create table if not exists public.google_ads_oauth_states (
  state_hash text primary key check (length(state_hash) = 64),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_verifier text not null check (length(code_verifier) between 43 and 128),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists google_ads_oauth_states_expiry_idx
  on public.google_ads_oauth_states(expires_at);

create table if not exists public.google_ads_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  refresh_token_encrypted text not null,
  scope text not null default 'https://www.googleapis.com/auth/adwords',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists google_ads_connections_user_idx
  on public.google_ads_connections(user_id, connected_at desc);

alter table public.google_ads_oauth_states enable row level security;
alter table public.google_ads_connections enable row level security;

revoke all on public.google_ads_oauth_states from public, anon, authenticated;
revoke all on public.google_ads_connections from public, anon, authenticated;
grant select, insert, update, delete on public.google_ads_oauth_states to service_role;
grant select, insert, update, delete on public.google_ads_connections to service_role;

-- Consome state em operação atômica e com expiração; impede reutilização da callback.
create or replace function public.consume_google_ads_oauth_state(p_state_hash text)
returns table (user_id uuid, code_verifier text)
language sql security definer
set search_path = public
as $$
  delete from public.google_ads_oauth_states as s
  where s.state_hash = p_state_hash
    and s.expires_at > now()
  returning s.user_id, s.code_verifier;
$$;

revoke all on function public.consume_google_ads_oauth_state(text)
  from public, anon, authenticated;
grant execute on function public.consume_google_ads_oauth_state(text)
  to service_role;

comment on table public.google_ads_oauth_states is
  'Estados OAuth com PKCE válidos 10 minutos, consumidos uma única vez em callback';
comment on table public.google_ads_connections is
  'Autorizações Google Ads por usuário Kivai com refresh token cifrado AES-256-GCM; sem operações mutate';
