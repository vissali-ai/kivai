-- One lifetime public demonstration per anonymous visitor: one video summary
-- and one narration. Signed-in Free/Pro/Agency quotas remain unchanged.
create table if not exists public.video_study_guest_trial (
 visitor_key text primary key check (visitor_key ~ '^[a-f0-9]{64}$'),
 summaries integer not null default 0 check(summaries between 0 and 1),
 audio integer not null default 0 check(audio between 0 and 1),
 created_at timestamptz not null default now()
);
alter table public.video_study_guest_trial enable row level security;
revoke all on public.video_study_guest_trial from public,anon,authenticated;
grant select,insert,update,delete on public.video_study_guest_trial to service_role;

-- Honor usage already recorded, so previously consumed free analyses do
-- not reset just because of this migration.
insert into public.video_study_guest_trial(visitor_key,summaries,audio)
select visitor_key,least(1,max(summaries)),least(1,max(audio))
from public.video_study_guest_usage
group by visitor_key
on conflict(visitor_key) do update set
 summaries=greatest(public.video_study_guest_trial.summaries,excluded.summaries),
 audio=greatest(public.video_study_guest_trial.audio,excluded.audio);

create or replace function public.kivai_reserve_guest_video_study(p_visitor_key text,p_kind text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_visitor_key is null or p_visitor_key !~ '^[a-f0-9]{64}$' or p_kind not in ('summary','audio') then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_visitor_key,0));
 insert into public.video_study_guest_trial(visitor_key) values(p_visitor_key)
 on conflict do nothing;
 if p_kind='summary' then
  update public.video_study_guest_trial set summaries=1
  where visitor_key=p_visitor_key and summaries=0;
 else
  update public.video_study_guest_trial set audio=1
  where visitor_key=p_visitor_key and audio=0 and summaries=1;
 end if;
 return found;
end $$;
revoke all on function public.kivai_reserve_guest_video_study(text,text) from public,anon,authenticated;
grant execute on function public.kivai_reserve_guest_video_study(text,text) to service_role;

create or replace function public.kivai_refund_guest_video_study(p_visitor_key text,p_kind text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_visitor_key is null or p_visitor_key !~ '^[a-f0-9]{64}$' or p_kind not in ('summary','audio') then return; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_visitor_key,0));
 if p_kind='summary' then
  update public.video_study_guest_trial set summaries=0
  where visitor_key=p_visitor_key and summaries=1 and audio=0;
 else
  update public.video_study_guest_trial set audio=0
  where visitor_key=p_visitor_key and audio=1;
 end if;
end $$;
revoke all on function public.kivai_refund_guest_video_study(text,text) from public,anon,authenticated;
grant execute on function public.kivai_refund_guest_video_study(text,text) to service_role;
