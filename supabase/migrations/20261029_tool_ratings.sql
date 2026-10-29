-- Uma avaliação real por usuário e ferramenta. A tabela somente é acessada pelo servidor.
create table if not exists public.tool_ratings (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null check (tool_slug ~ '^[a-z0-9-]{2,100}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tool_ratings_tool_user_unique unique (tool_slug, user_id)
);
create index if not exists tool_ratings_slug_idx on public.tool_ratings(tool_slug);
alter table public.tool_ratings enable row level security;
revoke all on public.tool_ratings from anon, authenticated;
-- O servidor usa a role de serviço para validação, leitura agregada e gravações.

-- Agregação no banco: contagem exata, sem transferir votos individuais.
create or replace function public.kivai_tool_rating_summary(p_slug text)
returns table(rating_value numeric, rating_count bigint)
language sql stable security invoker set search_path=public as $$
  select round(avg(rating)::numeric,1), count(*) from public.tool_ratings where tool_slug=p_slug;
$$;
revoke all on function public.kivai_tool_rating_summary(text) from public, anon, authenticated;
grant execute on function public.kivai_tool_rating_summary(text) to service_role;
