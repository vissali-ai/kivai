alter table public.site_contents
  add column if not exists display_location text not null default 'direct',
  add column if not exists show_in_most_used boolean not null default false,
  add column if not exists display_order integer not null default 100;

alter table public.site_contents
  add constraint site_contents_display_location_check
  check (display_location in ('direct', 'home', 'help', 'main_nav', 'footer', 'resource_library'));

create table if not exists public.site_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  path text not null unique,
  title text not null,
  short_description text not null default '',
  content_html text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  canonical_url text not null default '',
  badge text not null default '',
  service_type text not null default '',
  audience text not null default '',
  cta_label text not null default 'Solicitar orçamento',
  cta_url text not null default '/contato',
  cover_image_url text not null default '',
  existing_service_slug text unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  indexable boolean not null default false,
  include_in_sitemap boolean not null default false,
  show_in_services_index boolean not null default true,
  display_order integer not null default 100,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_services_published_index_check check (not indexable or status = 'published'),
  constraint site_services_sitemap_check check (not include_in_sitemap or (status = 'published' and indexable))
);

create index if not exists site_services_public_list_idx
  on public.site_services (status, show_in_services_index, display_order, title);

alter table public.site_services enable row level security;
revoke all on table public.site_services from anon, authenticated;
grant all on table public.site_services to service_role;

drop trigger if exists set_site_services_updated_at on public.site_services;
create trigger set_site_services_updated_at
before update on public.site_services
for each row execute function public.set_blog_updated_at();
