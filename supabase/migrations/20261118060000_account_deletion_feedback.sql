create table if not exists public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback text not null check (char_length(feedback) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;
revoke all on public.account_deletion_feedback from public, anon, authenticated;
grant insert, select on public.account_deletion_feedback to service_role;
