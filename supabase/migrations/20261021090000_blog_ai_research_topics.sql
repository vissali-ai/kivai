begin;
create table if not exists public.blog_ai_research_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  search_terms text not null,
  category_slug text not null default 'tecnologia',
  enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
alter table public.blog_ai_research_topics enable row level security;
revoke all on public.blog_ai_research_topics from anon, authenticated;
grant all on public.blog_ai_research_topics to service_role;
insert into public.blog_ai_research_topics (slug,name,search_terms,category_slug,sort_order) values
('tecnologia','Tecnologia','tecnologia, software, lançamentos, inovação e tendências','tecnologia',1),
('inteligencia-artificial','Inteligência Artificial','Gemini, ChatGPT, Claude, modelos de IA, agentes e aplicações','inteligencia-artificial',2),
('marketing-digital','Marketing Digital','marketing digital, estratégias, campanhas e ferramentas','marketing',3),
('seo','SEO','Google Search, algoritmo, SEO, indexação e tráfego orgânico','marketing',4),
('e-commerce','E-commerce','e-commerce, comércio eletrônico, plataformas e vendas online','e-commerce',5),
('marketplaces','Marketplaces','Mercado Livre, Shopee, Amazon, taxas e novidades','e-commerce',6),
('redes-sociais','Redes Sociais','Instagram, TikTok, YouTube, Threads, Facebook e X','marketing',7),
('trafego-pago','Tráfego Pago','Google Ads, Meta Ads, anúncios e mídia digital','marketing',8),
('automacao','Automação','n8n, Make, Zapier, processos e integrações','tecnologia',9),
('programacao','Programação','desenvolvimento web, linguagens, frameworks e devtools','tecnologia',10),
('ferramentas-digitais','Ferramentas Digitais','aplicativos, SaaS, ferramentas online e utilitários','tecnologia',11),
('empreendedorismo-digital','Empreendedorismo Digital','startups, negócios digitais, monetização e oportunidades','e-commerce',12),
('ciberseguranca','Cibersegurança','segurança online, privacidade, golpes digitais e proteção de dados','tecnologia',13),
('design-e-criacao-digital','Design e Criação Digital','Canva, Adobe, design, edição de imagens e vídeos','tecnologia',14),
('produtividade','Produtividade','gestão de tarefas, trabalho remoto e eficiência','tecnologia',15)
on conflict (slug) do nothing;
commit;
