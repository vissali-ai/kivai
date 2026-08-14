insert into public.blog_rss_sources (name, feed_url, site_url, default_category_slug)
values
  ('Mobile Time', 'https://www.mobiletime.com.br/feed/', 'https://www.mobiletime.com.br/', 'tecnologia'),
  ('Mundo do Marketing', 'https://mundodomarketing.com.br/', 'https://mundodomarketing.com.br/', 'marketing'),
  ('RD Station', 'https://www.rdstation.com/post-sitemap.xml', 'https://www.rdstation.com/blog/', 'marketing'),
  ('Nuvemshop Blog', 'https://www.nuvemshop.com.br/blog/feed/', 'https://www.nuvemshop.com.br/blog/', 'e-commerce'),
  ('VTEX Brasil', 'https://www.vtex.com/pt-br/sitemap.xml', 'https://www.vtex.com/pt-br/recursos/blog/', 'e-commerce'),
  ('Sebrae Ferramentas Digitais', 'https://sebrae.com.br/sitemap.xml', 'https://sebrae.com.br/subsites/mercado-digital/caixa-de-ferramentas', 'guia-de-ferramentas')
on conflict (feed_url) do update
set
  name = excluded.name,
  site_url = excluded.site_url,
  default_category_slug = excluded.default_category_slug,
  enabled = true,
  updated_at = now();
