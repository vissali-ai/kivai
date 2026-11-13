-- Audit log for irreversible administrative deletion of private study assets.
create table if not exists public.video_study_admin_audit(
 id bigint generated always as identity primary key,
 action text not null check(action in ('delete_audio','delete_project','delete_playlist','cleanup_expired')),
 subject_user_id uuid not null,
 project_id uuid,
 recorded_at timestamptz not null default now()
);
alter table public.video_study_admin_audit enable row level security;
revoke all on public.video_study_admin_audit from anon,authenticated;
grant select,insert on public.video_study_admin_audit to service_role;
