begin;

alter table public.blog_posts
  drop constraint if exists blog_posts_status_check;

alter table public.blog_posts
  add constraint blog_posts_status_check
  check (status in ('draft', 'published', 'scheduled', 'archived'));

update public.blog_posts
set
  status = 'archived',
  scheduled_at = null,
  featured = false,
  featured_order = null,
  updated_at = now()
where origin = 'rss-agent'
  and status = 'published';

commit;
