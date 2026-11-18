create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feedback text check (feedback is null or char_length(feedback) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by text
);

create index if not exists account_deletion_requests_status_requested_idx
  on public.account_deletion_requests (status, requested_at desc);

create unique index if not exists account_deletion_requests_one_pending_per_user
  on public.account_deletion_requests (user_id) where status = 'pending';

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public, anon, authenticated;
grant select, insert, update on public.account_deletion_requests to service_role;

drop table if exists public.account_deletion_feedback;
