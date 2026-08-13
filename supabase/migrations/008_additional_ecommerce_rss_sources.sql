insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('Yampi Blog', 'https://www.yampi.com.br/blog/feed/', 'https://www.yampi.com.br/blog/', 'e-commerce'),
  ('Mercado & Consumo E-commerce', 'https://mercadoeconsumo.com.br/category/ecommerce/feed/', 'https://mercadoeconsumo.com.br/category/ecommerce/', 'e-commerce'),
  ('Blog Vindi', 'https://blog.vindi.com.br/feed/', 'https://blog.vindi.com.br/', 'e-commerce')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
