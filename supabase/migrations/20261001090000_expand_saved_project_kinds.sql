-- Extend the existing paid project library without changing free tools or paid limits.
alter table public.saved_tool_projects drop constraint if exists saved_tool_projects_kind_check;
alter table public.saved_tool_projects add constraint saved_tool_projects_kind_check
  check (kind in ('calendar','briefing','qr_code','watermark','social_report'));

-- Update existing CMS-managed copy in place; preserve all unrelated Admin edits.
update public.site_contents
set short_description = replace(short_description, 'salve calendários e briefings na conta', 'salve calendários, briefings, QR Codes, modelos de marca d’água e relatórios na conta'),
    content_html = replace(replace(content_html,
      'Os limites de projetos somam calendários e briefings.',
      'Os limites de projetos somam calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media.'),
      'Abra o calendário ou o planejador,', 'Abra uma ferramenta com salvamento na conta,'),
    seo_description = replace(seo_description, 'calendários e briefings salvos no Pro', 'projetos salvos no Pro'),
    custom_data = jsonb_set(custom_data, '{originalFields}',
      (select jsonb_agg(case
        when item->>'key' = 'pro-features' then jsonb_set(item, '{value}', to_jsonb(replace(item->>'value', 'Até 30 calendários e briefings salvos na conta', 'Até 30 projetos de calendário, briefing, QR Code, marca d’água ou relatório salvos na conta')))
        when item->>'key' = 'agency-features' then jsonb_set(item, '{value}', to_jsonb(replace(item->>'value', 'Até 200 calendários e briefings salvos na conta', 'Até 200 projetos de calendário, briefing, QR Code, marca d’água ou relatório salvos na conta')))
        else item end order by ord)
       from jsonb_array_elements(custom_data->'originalFields') with ordinality as fields(item,ord)))
where path = '/planos' and custom_data ? 'originalFields';

update public.site_services
set short_description = replace(short_description, 'salve calendários e briefings na conta', 'salve calendários, briefings, QR Codes, modelos de marca d’água e relatórios na conta'),
    content_html = replace(replace(content_html,
      'Os limites de projetos somam calendários e briefings.',
      'Os limites de projetos somam calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media.'),
      'Abra o calendário ou o planejador,', 'Abra uma ferramenta com salvamento na conta,'),
    seo_description = replace(seo_description, 'calendários e briefings salvos no Pro', 'projetos salvos no Pro')
where path = '/servicos/planos-kivai';

