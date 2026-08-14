create table if not exists public.news_radar_category_sources (
  category_slug text not null,
  source_id uuid not null references public.blog_rss_sources(id) on delete cascade,
  priority integer not null default 5 check (priority between 1 and 10),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (category_slug, source_id),
  check (category_slug in ('marketing', 'inteligencia-artificial', 'e-commerce'))
);

create table if not exists public.news_radar_cache (
  category_slug text primary key,
  payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz,
  expires_at timestamptz,
  lock_token uuid,
  lock_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  check (category_slug in ('marketing', 'inteligencia-artificial', 'e-commerce'))
);

create table if not exists public.news_radar_rate_limits (
  identifier_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.news_radar_daily_metrics (
  metric_date date not null default (now() at time zone 'America/Sao_Paulo')::date,
  category_slug text not null,
  searches integer not null default 0,
  cache_hits integer not null default 0,
  results_returned integer not null default 0,
  partial_results integer not null default 0,
  empty_results integer not null default 0,
  errors integer not null default 0,
  outbound_clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (metric_date, category_slug),
  check (category_slug in ('marketing', 'inteligencia-artificial', 'e-commerce'))
);

create table if not exists public.news_radar_daily_source_clicks (
  metric_date date not null default (now() at time zone 'America/Sao_Paulo')::date,
  category_slug text not null,
  source_name text not null,
  clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (metric_date, category_slug, source_name),
  check (category_slug in ('marketing', 'inteligencia-artificial', 'e-commerce'))
);

create index if not exists news_radar_category_sources_source_id_idx
  on public.news_radar_category_sources (source_id);

create index if not exists news_radar_rate_limits_updated_at_idx
  on public.news_radar_rate_limits (updated_at);

create or replace function public.claim_news_radar_collection(
  p_category_slug text,
  p_lock_token uuid,
  p_lock_seconds integer
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  claimed_slug text;
begin
  if p_category_slug not in ('marketing', 'inteligencia-artificial', 'e-commerce') then
    return false;
  end if;

  insert into public.news_radar_cache (category_slug, lock_token, lock_expires_at, updated_at)
  values (
    p_category_slug,
    p_lock_token,
    now() + make_interval(secs => greatest(least(p_lock_seconds, 120), 10)),
    now()
  )
  on conflict (category_slug) do update
  set
    lock_token = excluded.lock_token,
    lock_expires_at = excluded.lock_expires_at,
    updated_at = now()
  where news_radar_cache.lock_token is null
     or news_radar_cache.lock_expires_at is null
     or news_radar_cache.lock_expires_at < now()
  returning category_slug into claimed_slug;

  return claimed_slug is not null;
end;
$$;

create or replace function public.consume_news_radar_rate_limit(
  p_identifier_hash text,
  p_request_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  allowed boolean;
begin
  delete from public.news_radar_rate_limits
  where updated_at < now() - interval '2 days';

  insert into public.news_radar_rate_limits (identifier_hash, window_started_at, request_count, updated_at)
  values (left(p_identifier_hash, 128), now(), 1, now())
  on conflict (identifier_hash) do update
  set
    request_count = case
      when news_radar_rate_limits.window_started_at < now() - make_interval(secs => greatest(least(p_window_seconds, 3600), 60)) then 1
      else news_radar_rate_limits.request_count + 1
    end,
    window_started_at = case
      when news_radar_rate_limits.window_started_at < now() - make_interval(secs => greatest(least(p_window_seconds, 3600), 60)) then now()
      else news_radar_rate_limits.window_started_at
    end,
    updated_at = now()
  returning request_count <= greatest(least(p_request_limit, 120), 1) into allowed;

  return coalesce(allowed, false);
end;
$$;

create or replace function public.increment_news_radar_metric(
  p_category_slug text,
  p_searches integer default 0,
  p_cache_hits integer default 0,
  p_results_returned integer default 0,
  p_partial_results integer default 0,
  p_empty_results integer default 0,
  p_errors integer default 0,
  p_outbound_clicks integer default 0
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_category_slug not in ('marketing', 'inteligencia-artificial', 'e-commerce') then
    return;
  end if;

  insert into public.news_radar_daily_metrics (
    metric_date, category_slug, searches, cache_hits, results_returned,
    partial_results, empty_results, errors, outbound_clicks, updated_at
  ) values (
    (now() at time zone 'America/Sao_Paulo')::date,
    p_category_slug,
    greatest(p_searches, 0),
    greatest(p_cache_hits, 0),
    greatest(p_results_returned, 0),
    greatest(p_partial_results, 0),
    greatest(p_empty_results, 0),
    greatest(p_errors, 0),
    greatest(p_outbound_clicks, 0),
    now()
  )
  on conflict (metric_date, category_slug) do update
  set
    searches = news_radar_daily_metrics.searches + excluded.searches,
    cache_hits = news_radar_daily_metrics.cache_hits + excluded.cache_hits,
    results_returned = news_radar_daily_metrics.results_returned + excluded.results_returned,
    partial_results = news_radar_daily_metrics.partial_results + excluded.partial_results,
    empty_results = news_radar_daily_metrics.empty_results + excluded.empty_results,
    errors = news_radar_daily_metrics.errors + excluded.errors,
    outbound_clicks = news_radar_daily_metrics.outbound_clicks + excluded.outbound_clicks,
    updated_at = now();
end;
$$;

create or replace function public.increment_news_radar_source_click(
  p_category_slug text,
  p_source_name text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_category_slug not in ('marketing', 'inteligencia-artificial', 'e-commerce')
     or length(trim(p_source_name)) < 1 then
    return;
  end if;

  insert into public.news_radar_daily_source_clicks (
    metric_date, category_slug, source_name, clicks, updated_at
  ) values (
    (now() at time zone 'America/Sao_Paulo')::date,
    p_category_slug,
    left(trim(p_source_name), 120),
    1,
    now()
  )
  on conflict (metric_date, category_slug, source_name) do update
  set clicks = news_radar_daily_source_clicks.clicks + 1, updated_at = now();
end;
$$;

insert into public.news_radar_category_sources (category_slug, source_id, priority)
select seed.category_slug, source.id, seed.priority
from (values
  ('marketing', 'https://www.meioemensagem.com.br/feed/', 1),
  ('marketing', 'https://propmark.com.br/feed/', 2),
  ('marketing', 'https://mundodomarketing.com.br/', 3),
  ('marketing', 'https://www.rdstation.com/post-sitemap.xml', 4),
  ('inteligencia-artificial', 'https://tecnoblog.net/tema/inteligencia-artificial/feed/', 1),
  ('inteligencia-artificial', 'https://mittechreview.com.br/topicos/inteligencia-artificial/feed/', 2),
  ('inteligencia-artificial', 'https://olhardigital.com.br/editorias/inteligencia-artificial/feed/', 3),
  ('e-commerce', 'https://ecommercenapratica.com/feed/', 1),
  ('e-commerce', 'https://blog.bling.com.br/feed/', 2),
  ('e-commerce', 'https://lojaintegrada.com.br/hub/feed/', 3),
  ('e-commerce', 'https://melhorenvio.com.br/blog/feed/', 4),
  ('e-commerce', 'https://www.yampi.com.br/blog/feed/', 5)
) as seed(category_slug, feed_url, priority)
join public.blog_rss_sources source on source.feed_url = seed.feed_url
on conflict (category_slug, source_id) do update
set priority = excluded.priority, enabled = true;

alter table public.news_radar_category_sources enable row level security;
alter table public.news_radar_cache enable row level security;
alter table public.news_radar_rate_limits enable row level security;
alter table public.news_radar_daily_metrics enable row level security;
alter table public.news_radar_daily_source_clicks enable row level security;

revoke all on public.news_radar_category_sources from anon, authenticated;
revoke all on public.news_radar_cache from anon, authenticated;
revoke all on public.news_radar_rate_limits from anon, authenticated;
revoke all on public.news_radar_daily_metrics from anon, authenticated;
revoke all on public.news_radar_daily_source_clicks from anon, authenticated;
revoke all on function public.claim_news_radar_collection(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.consume_news_radar_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.increment_news_radar_metric(text, integer, integer, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.increment_news_radar_source_click(text, text) from public, anon, authenticated;

grant usage on schema public to service_role;
grant select on public.news_radar_category_sources to service_role;
grant select, insert, update on public.news_radar_cache to service_role;
grant select, insert, update, delete on public.news_radar_rate_limits to service_role;
grant select, insert, update on public.news_radar_daily_metrics to service_role;
grant insert, update on public.news_radar_daily_source_clicks to service_role;
grant execute on function public.claim_news_radar_collection(text, uuid, integer) to service_role;
grant execute on function public.consume_news_radar_rate_limit(text, integer, integer) to service_role;
grant execute on function public.increment_news_radar_metric(text, integer, integer, integer, integer, integer, integer, integer) to service_role;
grant execute on function public.increment_news_radar_source_click(text, text) to service_role;
