-- Executar no Supabase antes de habilitar a hospedagem de favicons.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('hosted-favicons', 'hosted-favicons', true, 512000, array['image/x-icon', 'image/vnd.microsoft.icon']) on conflict (id) do nothing;
-- Objetos só são gravados por chamadas autenticadas no servidor (service role).
create table if not exists public.hosted_favicons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 512000),
  created_at timestamptz not null default now()
);
create index if not exists hosted_favicons_user_idx on public.hosted_favicons (user_id, created_at desc);
alter table public.hosted_favicons enable row level security;
revoke all on public.hosted_favicons from anon, authenticated;
-- Serialização por usuário para impedir corridas ao atingir limites.
create or replace function public.kivai_reserve_favicon(p_user_id uuid, p_path text, p_url text, p_bytes integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_plan text; v_count bigint; v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  v_plan := public.kivai_effective_plan(p_user_id);
  if v_plan not in ('free', 'pro', 'agency') then raise exception 'INVALID_PLAN'; end if;
  if p_bytes < 1 or p_bytes > (case when v_plan = 'free' then 102400 else 512000 end) then raise exception 'FAVICON_TOO_LARGE'; end if;
  select count(*) into v_count from public.hosted_favicons where user_id = p_user_id;
  if (v_plan = 'free' and v_count >= 5) or (v_plan = 'pro' and v_count >= 100) then raise exception 'FAVICON_QUOTA'; end if;
  if p_path not like p_user_id::text || '/%' then raise exception 'INVALID_PATH'; end if;
  insert into public.hosted_favicons(user_id, storage_path, public_url, byte_size)
    values (p_user_id, p_path, p_url, p_bytes) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.kivai_reserve_favicon(uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.kivai_reserve_favicon(uuid,text,text,integer) to service_role;
