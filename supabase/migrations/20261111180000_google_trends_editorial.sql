-- Google Trends (Brasil): tema próprio e fonte RSS de tendências com notícias vinculadas.
-- O RSS aponta tendências, não artigos. O coletor usa links jornalísticos associados.
begin;
insert into public.blog_ai_research_topics
  (slug, name, search_terms, category_slug, enabled, sort_order)
values
  ('google-trends', 'Google Trends', 'pesquisas em alta, assuntos do momento, tendências de busca, Google Trends', 'noticias', true, 16)
on conflict (slug) do update
  set name = excluded.name,
      search_terms = excluded.search_terms,
      enabled = true;

insert into public.blog_rss_sources
  (name, feed_url, site_url, default_category_slug, editorial_topic_slugs, enabled)
values
  ('Google Trends Brasil', 'https://trends.google.com/trending/rss?geo=BR',
   'https://trends.google.com/trending?geo=BR', 'noticias',
   array['google-trends']::text[], true)
on conflict (feed_url) do update
  set name = excluded.name,
      site_url = excluded.site_url,
      editorial_topic_slugs = excluded.editorial_topic_slugs,
      enabled = true;
commit;
