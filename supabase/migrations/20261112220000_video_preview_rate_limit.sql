-- Isolated rate limiting for the free YouTube preview, without touching AI wallets.
create table if not exists public.ai_video_preview_limits (
  day_utc date not null,
  client_key text not null,
  hits integer not null default 0 check (hits between 0 and 1000),
  primary key (day_utc, client_key)
);
alter table public.ai_video_preview_limits enable row level security;
revoke all on public.ai_video_preview_limits from public, anon, authenticated;
grant select, insert, update on public.ai_video_preview_limits to service_role;

create or replace function public.reserve_ai_video_preview(p_client_key text)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare
  today_utc date := (now() at time zone 'utc')::date;
  current_hits integer;
begin
  if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  insert into public.ai_video_preview_limits (day_utc, client_key, hits)
  values (today_utc, 'global', 1)
  on conflict(day_utc,client_key) do update set hits=public.ai_video_preview_limits.hits+1
    where public.ai_video_preview_limits.hits < 30
  returning hits into current_hits;
  if current_hits is null then return false; end if;
  insert into public.ai_video_preview_limits (day_utc, client_key, hits)
  values (today_utc, p_client_key, 1)
  on conflict(day_utc,client_key) do update set hits=public.ai_video_preview_limits.hits+1
    where public.ai_video_preview_limits.hits < 3
  returning hits into current_hits;
  return current_hits is not null;
end;
$$;
revoke all on function public.reserve_ai_video_preview(text) from public, anon, authenticated;
grant execute on function public.reserve_ai_video_preview(text) to service_role;