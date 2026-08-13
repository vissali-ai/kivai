insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('Tecnoblog IA', 'https://tecnoblog.net/tema/inteligencia-artificial/feed/', 'https://tecnoblog.net/tema/inteligencia-artificial/', 'inteligencia-artificial'),
  ('MIT Technology Review Brasil IA', 'https://mittechreview.com.br/topicos/inteligencia-artificial/feed/', 'https://mittechreview.com.br/topicos/inteligencia-artificial/', 'inteligencia-artificial'),
  ('Olhar Digital IA', 'https://olhardigital.com.br/editorias/inteligencia-artificial/feed/', 'https://olhardigital.com.br/editorias/inteligencia-artificial/', 'inteligencia-artificial'),
  ('Propmark', 'https://propmark.com.br/feed/', 'https://propmark.com.br/', 'marketing'),
  ('Meio & Mensagem', 'https://www.meioemensagem.com.br/feed/', 'https://www.meioemensagem.com.br/', 'marketing'),
  ('E-commerce na Pratica', 'https://ecommercenapratica.com/feed/', 'https://ecommercenapratica.com/', 'e-commerce'),
  ('Bling Blog', 'https://blog.bling.com.br/feed/', 'https://blog.bling.com.br/', 'e-commerce'),
  ('Loja Integrada', 'https://lojaintegrada.com.br/hub/feed/', 'https://lojaintegrada.com.br/hub/', 'e-commerce'),
  ('Melhor Envio Blog', 'https://melhorenvio.com.br/blog/feed/', 'https://melhorenvio.com.br/blog/', 'e-commerce')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
