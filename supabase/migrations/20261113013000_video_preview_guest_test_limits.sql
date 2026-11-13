-- Preview only: broaden evaluation traffic while preserving a server-side anti-abuse circuit breaker.
-- This RPC remains accessible only with the Supabase service role (server side).
create or replace function public.reserve_ai_video_preview(p_client_key text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare today_utc date:=(now() at time zone 'utc')::date; current_hits integer;
begin
 if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$' then return false; end if;
 insert into public.ai_video_preview_limits(day_utc,client_key,hits)
 values(today_utc,'global',1)
 on conflict(day_utc,client_key) do update set hits=public.ai_video_preview_limits.hits+1
 where public.ai_video_preview_limits.hits<100 returning hits into current_hits;
 if current_hits is null then return false; end if;
 current_hits:=null;
 insert into public.ai_video_preview_limits(day_utc,client_key,hits)
 values(today_utc,p_client_key,1)
 on conflict(day_utc,client_key) do update set hits=public.ai_video_preview_limits.hits+1
 where public.ai_video_preview_limits.hits<60 returning hits into current_hits;
 return current_hits is not null;
end $$;
revoke all on function public.reserve_ai_video_preview(text) from public,anon,authenticated;
grant execute on function public.reserve_ai_video_preview(text) to service_role;