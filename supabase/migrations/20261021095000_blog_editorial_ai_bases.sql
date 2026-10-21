begin;
create table if not exists public.blog_editorial_ai_bases (
  post_id uuid primary key references public.blog_posts(id) on delete cascade,
  source_url text not null,
  base_title text not null,
  base_subtitle text not null default '',
  base_excerpt text not null default '',
  base_html text not null,
  research_notes text not null default '',
  model text not null default '',
  created_at timestamptz not null default now()
);
alter table public.blog_editorial_ai_bases enable row level security;
revoke all on public.blog_editorial_ai_bases from anon, authenticated;
grant all on public.blog_editorial_ai_bases to service_role;
commit;