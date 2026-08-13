create extension if not exists pgcrypto;

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text, created_at timestamptz not null default now()
);
create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique
);
create table if not exists public.blog_media (
  id uuid primary key default gen_random_uuid(), url text not null, storage_path text not null unique,
  filename text not null, mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width integer not null check (width > 0), height integer not null check (height > 0),
  size bigint not null check (size > 0 and size <= 8388608), alt text, caption text, credit text,
  source text not null default 'other' check (source in ('own', 'press', 'press-kit', 'stock', 'creative-commons', 'other')),
  source_url text, content_hash text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(), title text not null, subtitle text, slug text not null unique,
  excerpt text not null default '', content text not null default '<p></p>',
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  author text not null default 'Kivai', source_name text, source_url text, original_published_at timestamptz,
  category_id uuid references public.blog_categories(id) on delete set null,
  cover_media_id uuid references public.blog_media(id) on delete restrict,
  cover_alt text, cover_caption text, cover_credit text, cover_source text, cover_source_url text,
  seo_title text, meta_description text, canonical_url text, og_title text, og_description text, og_image text,
  related_tool_slugs text[] not null default '{}', created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), published_at timestamptz, scheduled_at timestamptz,
  constraint blog_posts_schedule_check check (status <> 'scheduled' or scheduled_at is not null)
);
create table if not exists public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_category_idx on public.blog_posts(category_id);
create index if not exists blog_posts_published_idx on public.blog_posts(published_at desc);
create index if not exists blog_posts_scheduled_idx on public.blog_posts(scheduled_at) where status = 'scheduled';

create or replace function public.set_blog_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at before update on public.blog_posts
for each row execute function public.set_blog_updated_at();

alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_media enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_tags enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-media', 'blog-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;

-- Sem policies de escrita: o CMS usa exclusivamente a service role no servidor.
