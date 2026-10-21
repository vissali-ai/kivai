begin;
alter table public.blog_rss_sources
  add column if not exists editorial_topic_slugs text[] not null default '{}'::text[];

update public.blog_rss_sources s set editorial_topic_slugs = mapping.topics
from (values
('Bling Blog',ARRAY['e-commerce','marketplaces','automacao','ferramentas-digitais']::text[]),
('Blog do Google Brasil',ARRAY['tecnologia','inteligencia-artificial','seo','trafego-pago','redes-sociais','marketing-digital']::text[]),
('Blog Vindi',ARRAY['e-commerce','marketplaces','empreendedorismo-digital']::text[]),
('Canaltech',ARRAY['tecnologia','inteligencia-artificial','redes-sociais','ciberseguranca','design-e-criacao-digital']::text[]),
('E-Commerce Brasil',ARRAY['e-commerce','marketplaces','empreendedorismo-digital','marketing-digital']::text[]),
('E-commerce na Pratica',ARRAY['e-commerce','marketplaces','empreendedorismo-digital']::text[]),
('G1 Tecnologia',ARRAY['tecnologia','inteligencia-artificial','ciberseguranca','redes-sociais']::text[]),
('Loja Integrada',ARRAY['e-commerce','marketplaces','empreendedorismo-digital','marketing-digital']::text[]),
('Manual do Usuário',ARRAY['tecnologia','produtividade','ferramentas-digitais','ciberseguranca']::text[]),
('Meio & Mensagem',ARRAY['marketing-digital','redes-sociais','trafego-pago']::text[]),
('Melhor Envio Blog',ARRAY['e-commerce','marketplaces','automacao']::text[]),
('Mercado & Consumo E-commerce',ARRAY['e-commerce','marketplaces','empreendedorismo-digital']::text[]),
('MIT Technology Review Brasil IA',ARRAY['inteligencia-artificial','tecnologia','empreendedorismo-digital']::text[]),
('Mobile Time',ARRAY['tecnologia','redes-sociais','marketing-digital']::text[]),
('Mundo do Marketing',ARRAY['marketing-digital','trafego-pago','redes-sociais']::text[]),
('Nuvemshop Blog',ARRAY['e-commerce','marketplaces','empreendedorismo-digital','marketing-digital']::text[]),
('Olhar Digital',ARRAY['tecnologia','inteligencia-artificial','redes-sociais','ciberseguranca']::text[]),
('Olhar Digital IA',ARRAY['inteligencia-artificial','tecnologia','ferramentas-digitais']::text[]),
('OpenAI News',ARRAY['inteligencia-artificial','tecnologia','automacao']::text[]),
('Propmark',ARRAY['marketing-digital','trafego-pago','redes-sociais']::text[]),
('RD Station',ARRAY['marketing-digital','seo','automacao','trafego-pago']::text[]),
('Sebrae Ferramentas Digitais',ARRAY['empreendedorismo-digital','ferramentas-digitais','produtividade','marketing-digital']::text[]),
('Shopify Brasil',ARRAY['e-commerce','marketplaces','empreendedorismo-digital']::text[]),
('TecMundo',ARRAY['tecnologia','inteligencia-artificial','ciberseguranca','redes-sociais']::text[]),
('Tecnoblog',ARRAY['tecnologia','redes-sociais','ferramentas-digitais']::text[]),
('Tecnoblog IA',ARRAY['inteligencia-artificial','tecnologia']::text[]),
('Tray Escola de E-commerce',ARRAY['e-commerce','marketplaces','marketing-digital']::text[]),
('UOL Tecnologia',ARRAY['tecnologia','ciberseguranca','redes-sociais']::text[]),
('VTEX Brasil',ARRAY['e-commerce','marketplaces','automacao']::text[]),
('Yampi Blog',ARRAY['e-commerce','marketplaces','empreendedorismo-digital']::text[])
) as mapping(name, topics)
where s.name = mapping.name
  and cardinality(s.editorial_topic_slugs) = 0;

insert into public.blog_rss_sources
  (name,feed_url,site_url,default_category_slug,enabled,editorial_topic_slugs)
values
('Search Engine Land','https://searchengineland.com/feed','https://searchengineland.com','marketing',ARRAY['seo','trafego-pago','marketing-digital']::text[]),
('Search Engine Journal','https://www.searchenginejournal.com/feed/','https://www.searchenginejournal.com','marketing',ARRAY['seo','marketing-digital','trafego-pago']::text[]),
('BleepingComputer','https://www.bleepingcomputer.com/feed/','https://www.bleepingcomputer.com','tecnologia',ARRAY['ciberseguranca','tecnologia']::text[]),
('The Hacker News','https://thehackernews.com/feeds/posts/default','https://thehackernews.com','tecnologia',ARRAY['ciberseguranca','tecnologia']::text[]),
('Smashing Magazine','https://www.smashingmagazine.com/feed/','https://www.smashingmagazine.com','tecnologia',ARRAY['design-e-criacao-digital','programacao','ferramentas-digitais']::text[]),
('Cloudflare Blog','https://blog.cloudflare.com/rss/','https://blog.cloudflare.com','tecnologia',ARRAY['ciberseguranca','programacao','automacao']::text[]),
('GitHub Blog','https://github.blog/feed/','https://github.blog','tecnologia',ARRAY['programacao','automacao','tecnologia','inteligencia-artificial']::text[]),
('Buffer Blog','https://buffer.com/resources/feed/','https://buffer.com/resources','marketing',ARRAY['redes-sociais','marketing-digital','produtividade','design-e-criacao-digital']::text[]),
('Zapier Blog','https://zapier.com/blog/feeds/latest/','https://zapier.com/blog','tecnologia',ARRAY['automacao','produtividade','ferramentas-digitais','empreendedorismo-digital']::text[]),
('Social Media Today','https://www.socialmediatoday.com/feeds/news/','https://www.socialmediatoday.com','marketing',ARRAY['redes-sociais','marketing-digital','trafego-pago']::text[]),
('Meta Newsroom','https://about.fb.com/news/feed/','https://about.fb.com/news','tecnologia',ARRAY['redes-sociais','marketing-digital','inteligencia-artificial','trafego-pago']::text[])
on conflict (feed_url) do nothing;

create table if not exists public.blog_editorial_dismissed_suggestions (
  source_url text primary key,
  dismissed_at timestamptz not null default now(),
  constraint blog_editorial_dismissed_suggestions_url_len check (length(source_url) between 12 and 2048)
);
alter table public.blog_editorial_dismissed_suggestions enable row level security;
revoke all on public.blog_editorial_dismissed_suggestions from anon,authenticated;
grant select,insert,delete on public.blog_editorial_dismissed_suggestions to service_role;
commit;
