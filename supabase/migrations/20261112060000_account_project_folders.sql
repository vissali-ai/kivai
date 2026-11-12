-- Kivai account project folders. Apply to the Kivai Supabase project before deploying the UI.
-- Existing saved_tool_projects records are not modified.
create table if not exists public.account_project_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index if not exists account_project_folders_owner_name_idx
  on public.account_project_folders (user_id, lower(name));
create table if not exists public.account_project_folder_items (
  user_id uuid not null,
  project_id uuid not null references public.saved_tool_projects(id) on delete cascade,
  folder_id uuid not null,
  primary key (user_id, project_id),
  constraint account_project_folder_items_folder_fk
    foreign key (folder_id, user_id)
    references public.account_project_folders (id, user_id)
    on delete cascade
);
create index if not exists account_project_folder_items_folder_idx
  on public.account_project_folder_items (folder_id, user_id);
alter table public.account_project_folders enable row level security;
alter table public.account_project_folder_items enable row level security;
revoke all on public.account_project_folders from anon, authenticated;
revoke all on public.account_project_folder_items from anon, authenticated;
grant select, insert, update, delete on public.account_project_folders to service_role;
grant select, insert, update, delete on public.account_project_folder_items to service_role;
-- All CRUD goes through authenticated Kivai server routes. No direct browser table access.
