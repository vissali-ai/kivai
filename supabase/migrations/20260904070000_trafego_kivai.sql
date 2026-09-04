create table if not exists public.trafego_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text not null,
  email text not null,
  phone text not null,
  segment text not null default '', city text not null default '', state text not null default '', website text not null default '', instagram text not null default '',
  has_domain text not null default '', has_website text not null default '', has_landing_page text not null default '', has_google_ads text not null default '', has_google_business text not null default '', has_analytics text not null default '', has_tag_manager text not null default '', has_search_console text not null default '', has_social_media text not null default '',
  social_networks text[] not null default '{}', objective text not null default '', currently_advertising text not null default '', monthly_budget text not null default '', message text not null default '', privacy_consent boolean not null default false, privacy_consent_at timestamptz,
  utm_source text not null default '', utm_medium text not null default '', utm_campaign text not null default '', utm_term text not null default '', utm_content text not null default '', landing_page text not null default '', referrer text not null default '', status text not null default 'new' check (status in ('new','contacted','qualified','proposal','won','lost','archived'))
);
create index if not exists trafego_leads_created_at_idx on public.trafego_leads (created_at desc);
create index if not exists trafego_leads_status_idx on public.trafego_leads (status, created_at desc);
alter table public.trafego_leads enable row level security;
revoke all on table public.trafego_leads from anon, authenticated;
grant all on table public.trafego_leads to service_role;

insert into public.site_services (slug,path,title,short_description,content_html,seo_title,seo_description,canonical_url,badge,service_type,audience,cta_label,cta_url,status,indexable,include_in_sitemap,show_in_services_index,display_order,published_at)
values ('trafego-kivai','/servicos/trafego-kivai','Google Ads para gerar oportunidades reais','Gestão de Google Ads com landing page, mensuração, acompanhamento e estrutura digital para empresas que querem transformar buscas em oportunidades.','<h2>Estrutura de aquisição</h2><p>Google Ads, landing page, mensuração e acompanhamento organizados em uma operação orientada a oportunidades comerciais.</p><h2>O que está incluído</h2><p>Google Ads Search, landing page, Google Tag Manager, Google Analytics, Search Console, Google Business Profile quando aplicável, domínio e avaliação da presença social.</p><h2>Como funciona</h2><p>Diagnóstico, estrutura, campanha, mensuração, otimização e análise.</p><h2>Perguntas frequentes</h2><h3>A verba dos anúncios está incluída?</h3><p>Não. A verba de mídia é separada do serviço de gestão.</p><h3>Existe garantia de leads?</h3><p>Não é responsável prometer quantidade de leads, vendas ou faturamento.</p>','Google Ads para gerar oportunidades reais | Kivai','Gestão de Google Ads com landing page, mensuração e estrutura digital para transformar buscas em oportunidades comerciais.','https://trafego.kivai.com.br','Google Ads + estrutura de aquisição','Gestão de Google Ads','Empresas, profissionais e negócios de diferentes segmentos','Solicitar análise','#analise','published',true,false,false,999,now())
on conflict (slug) do update set
  title=excluded.title, short_description=excluded.short_description, content_html=excluded.content_html, seo_title=excluded.seo_title, seo_description=excluded.seo_description, canonical_url=excluded.canonical_url, badge=excluded.badge, service_type=excluded.service_type, audience=excluded.audience, cta_label=excluded.cta_label, cta_url=excluded.cta_url, status='published', indexable=true, include_in_sitemap=false, show_in_services_index=false, published_at=now();
