insert into public.customer_marketing_templates (
  flow_key,
  title,
  subject,
  description,
  message,
  cta_label,
  cta_url,
  enabled,
  updated_at
)
values (
  'new_post',
  'Envio automático de novas publicações',
  'Nova publicação no Kivai: {{titulo}}',
  'Enviado para todos os usuários cadastrados quando qualquer matéria entra no ar, imediatamente ou por agendamento. Variáveis disponíveis: {{titulo}}, {{resumo}}, {{slug}} e {{link}}.',
  'Tem conteúdo novo no Kivai.\n\n{{titulo}}\n\n{{resumo}}\n\nAcesse a publicação para ler o conteúdo completo.',
  'Ler publicação completa',
  'https://www.kivai.com.br/blog/{{slug}}',
  true,
  now()
)
on conflict (flow_key) do update
set
  title = excluded.title,
  subject = excluded.subject,
  description = excluded.description,
  message = excluded.message,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;
