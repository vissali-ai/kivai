alter table public.blog_posts
  add column if not exists publication_target text not null default 'kivai_blog';

alter table public.blog_posts
  drop constraint if exists blog_posts_publication_target_check;

alter table public.blog_posts
  add constraint blog_posts_publication_target_check
  check (publication_target in ('kivai_blog', 'kivai_streaming'));

create index if not exists blog_posts_publication_target_status_idx
  on public.blog_posts (publication_target, status, published_at desc);
