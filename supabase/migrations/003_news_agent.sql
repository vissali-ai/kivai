alter table public.blog_posts
  add column if not exists origin text not null default 'manual',
  add column if not exists review_status text not null default 'not-required',
  add column if not exists generation_model text,
  add column if not exists needs_cover boolean not null default false;

alter table public.blog_posts
  drop constraint if exists blog_posts_origin_check,
  drop constraint if exists blog_posts_review_status_check;

alter table public.blog_posts
  add constraint blog_posts_origin_check
    check (origin in ('manual', 'rss-agent')),
  add constraint blog_posts_review_status_check
    check (review_status in ('not-required', 'awaiting-review', 'approved', 'rejected'));

create table if not exists public.blog_rss_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  site_url text not null,
  default_category_slug text not null default 'tecnologia',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_news_agent_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  sources_checked integer not null default 0,
  items_found integer not null default 0,
  drafts_created integer not null default 0,
  items_skipped integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.blog_news_imports (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.blog_rss_sources(id) on delete set null,
  run_id uuid references public.blog_news_agent_runs(id) on delete set null,
  post_id uuid unique references public.blog_posts(id) on delete set null,
  source_guid text,
  source_url text not null unique,
  original_title text not null,
  original_excerpt text,
  original_published_at timestamptz,
  content_hash text not null unique,
  status text not null default 'processing'
    check (status in ('processing', 'draft-created', 'ignored', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists blog_news_imports_status_idx
  on public.blog_news_imports(status, created_at desc);

alter table public.blog_rss_sources enable row level security;
alter table public.blog_news_agent_runs enable row level security;
alter table public.blog_news_imports enable row level security;

insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'https://arstechnica.com', 'tecnologia'),
  ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'tecnologia'),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://www.theverge.com', 'tecnologia'),
  ('Google Blog', 'https://blog.google/rss/', 'https://blog.google', 'inteligencia-artificial'),
  ('OpenAI News', 'https://openai.com/news/rss.xml', 'https://openai.com/news', 'inteligencia-artificial')
on conflict (feed_url) do nothing;
