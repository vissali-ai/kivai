begin;

alter table public.blog_posts
  add column if not exists primary_source_url text,
  add column if not exists original_contribution text,
  add column if not exists relevance_score smallint not null default 0,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

alter table public.blog_posts
  drop constraint if exists blog_posts_review_status_check,
  drop constraint if exists blog_posts_relevance_score_check;

alter table public.blog_posts
  add constraint blog_posts_review_status_check
    check (review_status in (
      'not-required',
      'collected',
      'selected',
      'researching',
      'awaiting-review',
      'approved',
      'rejected'
    )),
  add constraint blog_posts_relevance_score_check
    check (relevance_score between 0 and 12);

update public.blog_posts
set review_status = 'collected'
where origin = 'rss-agent'
  and status = 'draft'
  and review_status = 'awaiting-review';

update public.blog_posts
set
  review_status = 'rejected',
  reviewed_by = null,
  reviewed_at = null
where origin = 'rss-agent'
  and status = 'archived';

commit;
