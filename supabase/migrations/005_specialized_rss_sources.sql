insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('MIT News AI', 'https://news.mit.edu/rss/topic/artificial-intelligence2', 'https://news.mit.edu/topic/artificial-intelligence2', 'inteligencia-artificial'),
  ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'https://huggingface.co/blog', 'inteligencia-artificial'),
  ('Google DeepMind', 'https://deepmind.google/blog/rss.xml', 'https://deepmind.google/blog/', 'inteligencia-artificial'),
  ('HubSpot Marketing', 'https://blog.hubspot.com/marketing/rss.xml', 'https://blog.hubspot.com/marketing', 'marketing'),
  ('Search Engine Journal', 'https://www.searchenginejournal.com/feed/', 'https://www.searchenginejournal.com', 'marketing'),
  ('Social Media Examiner', 'https://www.socialmediaexaminer.com/feed/', 'https://www.socialmediaexaminer.com', 'marketing'),
  ('Nuvemshop Blog', 'https://www.nuvemshop.com.br/blog/feed/', 'https://www.nuvemshop.com.br/blog/', 'e-commerce'),
  ('Practical Ecommerce', 'https://www.practicalecommerce.com/feed', 'https://www.practicalecommerce.com', 'e-commerce'),
  ('Digital Commerce 360', 'https://www.digitalcommerce360.com/feed/', 'https://www.digitalcommerce360.com', 'e-commerce')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
