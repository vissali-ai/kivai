alter table public.user_subscriptions
  add column if not exists automatic_grace_granted_at timestamptz,
  add column if not exists automatic_grace_original_period_end timestamptz;

create unique index if not exists customer_communications_event_channel_unique
  on public.customer_communications (event_key, channel);

create index if not exists user_subscriptions_automatic_grace_due_idx
  on public.user_subscriptions (status, current_period_end)
  where provider = 'sumup_external'
    and plan_code in ('pro', 'agency')
    and automatic_grace_granted_at is null;

update public.customer_marketing_templates
set
  title = 'Avisos automáticos de vencimento',
  subject = 'Seu Plano {{plano}} vence em {{dias}} dia(s)',
  description = 'Enviado automaticamente 7, 3 e 1 dia antes do vencimento para assinantes Pro e Agency. Variáveis disponíveis: {{nome}}, {{plano}}, {{dias}} e {{data_vencimento}}.',
  message = '{{nome}}, seu Plano {{plano}} Kivai vence em {{dias}} dia(s), em {{data_vencimento}}. Para continuar usando os recursos pagos e manter o histórico disponível, renove pelo seu painel. Se o pagamento já estiver em andamento, este aviso não será enviado novamente.',
  cta_label = 'Renovar meu plano',
  cta_url = 'https://www.kivai.com.br/planos',
  enabled = true,
  updated_at = now()
where flow_key = 'renewal';

update public.customer_marketing_templates
set
  title = 'Cortesia automática após vencimento',
  subject = 'Liberamos 7 dias grátis no seu Plano {{plano}}',
  description = 'Sete dias após o vencimento, concede uma única cortesia de 7 dias ao plano Pro ou Agency. Variáveis disponíveis: {{nome}}, {{plano}}, {{dias}}, {{data_vencimento}} e {{data_fim_cortesia}}.',
  message = '{{nome}}, percebemos que o seu Plano {{plano}} venceu em {{data_vencimento}}. Liberamos uma oportunidade de {{dias}} dias grátis, válida até {{data_fim_cortesia}}, para você continuar usando seus recursos e se organizar para reativar o pagamento. Renove dentro desse período para manter o acesso sem nova interrupção.',
  cta_label = 'Reativar meu pagamento',
  cta_url = 'https://www.kivai.com.br/planos',
  enabled = true,
  updated_at = now()
where flow_key = 'winback';
