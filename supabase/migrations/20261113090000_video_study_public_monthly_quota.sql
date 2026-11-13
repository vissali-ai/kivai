-- Monthly visitor limits for video summaries and narration without requiring an account.
create table if not exists public.video_study_guest_usage (
 month_start date not null,
 visitor_key text not null check (visitor_key ~ '^[a-f0-9]{64}$'),
 summaries integer not null default 0 check (summaries>=0),
 audio integer not null default 0 check (audio>=0),
 primary key (month_start,visitor_key)
);
alter table public.video_study_guest_usage enable row level security;
revoke all on public.video_study_guest_usage from public,anon,authenticated;
grant select,insert,update,delete on public.video_study_guest_usage to service_role;

create or replace function public.kivai_reserve_guest_video_study(p_visitor_key text,p_kind text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_month date:=date_trunc('month',now() at time zone 'utc')::date;
begin
 if p_visitor_key !~ '^[a-f0-9]{64}$' or p_kind not in ('summary','audio') then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_visitor_key || v_month::text || p_kind,0));
 insert into public.video_study_guest_usage(month_start,visitor_key)
 values(v_month,p_visitor_key) on conflict do nothing;
 if p_kind='summary' then
   update public.video_study_guest_usage set summaries=summaries+1
   where month_start=v_month and visitor_key=p_visitor_key and summaries<3;
 else
   update public.video_study_guest_usage set audio=audio+1
   where month_start=v_month and visitor_key=p_visitor_key and audio<3;
 end if;
 return found;
end $$;
revoke all on function public.kivai_reserve_guest_video_study(text,text) from public,anon,authenticated;
grant execute on function public.kivai_reserve_guest_video_study(text,text) to service_role;

create or replace function public.kivai_refund_guest_video_study(p_visitor_key text,p_kind text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_visitor_key !~ '^[a-f0-9]{64}$' or p_kind not in ('summary','audio') then return; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_visitor_key || date_trunc('month',now() at time zone 'utc')::date::text || p_kind,0));
 if p_kind='summary' then
   update public.video_study_guest_usage set summaries=greatest(0,summaries-1)
   where visitor_key=p_visitor_key and month_start=date_trunc('month',now() at time zone 'utc')::date;
 else
   update public.video_study_guest_usage set audio=greatest(0,audio-1)
   where visitor_key=p_visitor_key and month_start=date_trunc('month',now() at time zone 'utc')::date;
 end if;
end $$;
revoke all on function public.kivai_refund_guest_video_study(text,text) from public,anon,authenticated;
grant execute on function public.kivai_refund_guest_video_study(text,text) to service_role;
