-- Personalized shortcuts for each Kivai account. Projects and favorites remain untouched.
create table if not exists public.account_project_shortcuts (
  user_id uuid primary key,
  tool_kinds text[] not null default array['post_creator','calendar','briefing','social_report']::text[],
  updated_at timestamptz not null default now(),
  constraint account_project_shortcuts_count_check
    check (cardinality(tool_kinds) between 1 and 6)
);
alter table public.account_project_shortcuts enable row level security;
revoke all on public.account_project_shortcuts from anon, authenticated;
grant select, insert, update, delete on public.account_project_shortcuts to service_role;
-- Server routes authenticate the account before reading or writing; browser roles have no table access.
