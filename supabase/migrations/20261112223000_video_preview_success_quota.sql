alter table public.ai_video_preview_limits
  add column if not exists successes integer not null default 0 check (successes between 0 and 1000);

create or replace function public.reserve_ai_video_preview(p_client_key text)
returns boolean
language plpgsql security definer
set search_path=''
as $$
declare
  today_utc date := (now() at time zone 'utc')::date;
  current_hits integer;
begin
  if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$' then return false; end if;
  insert into public.ai_video_preview_limits (day_utc,client_key,hits)
  values (today_utc,'global',1)
  on conflict(day_utc,client_key) do update
    set hits=public.ai_video_preview_limits.hits+1
    where public.ai_video_preview_limits.hits < 30
  returning hits into current_hits;
  if current_hits is null then return false; end if;
  insert into public.ai_video_preview_limits (day_utc,client_key,hits)
  values (today_utc,p_client_key,1)
  on conflict(day_utc,client_key) do update
    set hits=public.ai_video_preview_limits.hits+1
    where public.ai_video_preview_limits.hits < 12
      and public.ai_video_preview_limits.successes < 3
  returning hits into current_hits;
  return current_hits is not null;
end;
$$;

create or replace function public.record_ai_video_preview_success(p_client_key text)
returns boolean
language plpgsql security definer
set search_path=''
as $$
declare recorded integer;
begin
  if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$' then return false; end if;
  update public.ai_video_preview_limits
    set successes=successes+1
    where day_utc=(now() at time zone 'utc')::date
      and client_key=p_client_key
      and successes < 3
    returning successes into recorded;
  return recorded is not null;
end;
$$;
revoke all on function public.record_ai_video_preview_success(text) from public,anon,authenticated;
grant execute on function public.record_ai_video_preview_success(text) to service_role;
revoke all on function public.reserve_ai_video_preview(text) from public,anon,authenticated;
grant execute on function public.reserve_ai_video_preview(text) to service_role;