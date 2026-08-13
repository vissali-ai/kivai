insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('Tecnoblog', 'https://tecnoblog.net/feed/', 'https://tecnoblog.net', 'tecnologia'),
  ('Manual do Usuário', 'https://manualdousuario.net/feed/', 'https://manualdousuario.net', 'tecnologia'),
  ('Canaltech', 'https://canaltech.com.br/rss/', 'https://canaltech.com.br', 'tecnologia'),
  ('UOL Tecnologia', 'https://rss.uol.com.br/feed/tecnologia.xml', 'https://www.uol.com.br/tilt/', 'tecnologia'),
  ('Olhar Digital', 'https://olhardigital.com.br/feed/', 'https://olhardigital.com.br', 'tecnologia'),
  ('TecMundo', 'https://rss.tecmundo.com.br/feed', 'https://www.tecmundo.com.br', 'tecnologia'),
  ('G1 Tecnologia', 'https://g1.globo.com/rss/g1/tecnologia/', 'https://g1.globo.com/tecnologia/', 'tecnologia')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
