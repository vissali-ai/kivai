create table if not exists public.site_hubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '',
  path text not null unique check (path ~ '^/[a-z0-9][a-z0-9/-]*$'),
  content_html text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  indexable boolean not null default false,
  include_in_sitemap boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_contents (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('tool','page','resource')),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  path text not null unique check (path ~ '^/[a-z0-9][a-z0-9/-]*$'),
  title text not null check (char_length(title) between 2 and 180),
  short_description text not null default '',
  content_html text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  canonical_url text not null default '',
  hub_id uuid references public.site_hubs(id) on delete set null,
  existing_tool_slug text unique,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  indexable boolean not null default false,
  include_in_sitemap boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (existing_tool_slug is null or content_type = 'tool')
);

create index if not exists site_contents_hub_id_idx on public.site_contents(hub_id);
create index if not exists site_contents_type_status_path_idx on public.site_contents(content_type, status, path);
create index if not exists site_contents_sitemap_idx on public.site_contents(updated_at desc)
  where status = 'published' and indexable and include_in_sitemap;
create index if not exists site_hubs_sitemap_idx on public.site_hubs(updated_at desc)
  where status = 'published' and indexable and include_in_sitemap;

create or replace function public.set_site_cms_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_hubs_updated_at on public.site_hubs;
create trigger set_site_hubs_updated_at before update on public.site_hubs
for each row execute function public.set_site_cms_updated_at();

drop trigger if exists set_site_contents_updated_at on public.site_contents;
create trigger set_site_contents_updated_at before update on public.site_contents
for each row execute function public.set_site_cms_updated_at();

alter table public.site_hubs enable row level security;
alter table public.site_contents enable row level security;
revoke all on public.site_hubs from anon, authenticated;
revoke all on public.site_contents from anon, authenticated;
grant select, insert, update, delete on public.site_hubs to service_role;
grant select, insert, update, delete on public.site_contents to service_role;

insert into public.site_hubs
  (slug, name, description, path, status, indexable, include_in_sitemap, published_at)
values
  ('imagens', 'Imagens', 'Ferramentas para editar, converter e otimizar imagens.', '/ferramentas/imagens', 'published', true, true, now()),
  ('pdfs', 'PDFs', 'Ferramentas para converter, organizar e editar arquivos PDF.', '/ferramentas/pdfs', 'published', true, true, now()),
  ('calculadoras', 'Calculadoras', 'Calculadoras online para marketing, vendas e negócios.', '/ferramentas/calculadoras', 'published', true, true, now()),
  ('texto', 'Texto', 'Ferramentas para analisar e formatar textos.', '/ferramentas/texto', 'published', true, true, now()),
  ('social-media', 'Social Media', 'Ferramentas de planejamento e análise para redes sociais.', '/ferramentas/social-media', 'published', true, true, now()),
  ('videos', 'Vídeos', 'Ferramentas para converter e editar vídeos.', '/ferramentas/videos', 'published', true, true, now()),
  ('arquivos', 'Arquivos', 'Ferramentas para inspecionar e trabalhar com arquivos.', '/ferramentas/arquivos', 'published', true, true, now())
on conflict (slug) do nothing;
