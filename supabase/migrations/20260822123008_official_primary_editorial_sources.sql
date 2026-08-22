insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('Blog do Google Brasil', 'https://blog.google/intl/pt-br/rss/', 'https://blog.google/intl/pt-br/', 'tecnologia'),
  ('Shopify Brasil', 'https://www.shopify.com/br/blog', 'https://www.shopify.com/br/blog', 'e-commerce'),
  ('OpenAI News', 'https://openai.com/news/rss.xml', 'https://openai.com/news/', 'inteligencia-artificial')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
