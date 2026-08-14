insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('E-Commerce Brasil', 'https://www.ecommercebrasil.com.br/', 'https://www.ecommercebrasil.com.br/', 'e-commerce'),
  ('Tray Escola de E-commerce', 'https://tray.com.br/escola/sitemap_index.xml', 'https://tray.com.br/escola/', 'e-commerce')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
