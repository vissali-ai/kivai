# Fase 2 — acompanhamento de renovação (05/11/2026)

## Entrega em revisão
- Aviso de vencimento e orientação para renovação no painel, somente para usuários com histórico Pro ou Agency, em períodos próximos do fim ou sem acesso pago efetivo.
- Reutilização dos fluxos existentes de lembretes e recuperação de cobrança. Nenhum novo cron criado.
- Nenhuma pesquisa, formulário de desistência, API de feedback ou relatório de motivos faz parte da entrega.
- Sem mudanças nos links de pagamento, checkout, preços, planos, permissões, créditos, RLS ou confirmação administrativa.

## Situação do fluxo financeiro atual
- O checkout público de Pro e Agency em `app/api/account/subscription-request/route.ts` utiliza links de planos da InfinitePay.
- O Kivai registra a solicitação e exige conferência administrativa do pagamento para ativar ou renovar o acesso.
- `/api/cron/billing-renewals` já concentra lembretes, expiração, cortesia e retentativas de e-mails. Os fluxos existentes foram preservados.
- A API pública de Checkout Integrado da InfinitePay não fornece gestão de Planos e Recorrências. Portanto, não foi criada uma confirmação de assinatura automática sem prova do pagamento.
- Cobrança recorrente no provedor e sincronização do acesso no Kivai são processos distintos. Para automatizar a ativação, será necessária integração oficial que permita conciliar assinatura, ciclo, valor e confirmação de pagamento.

## Acompanhamento operacional
- Assinaturas efetivamente ativas e próximas do vencimento.
- Pendências de pagamento e prazos de confirmação.
- Falhas de entrega dos avisos existentes.
- Acessos de teste separados dos assinantes pagos.

## Verificações antes da publicação
- Build e TypeScript.
- Confirmação da exibição do aviso somente para usuários elegíveis.
- Conferência visual no mobile e desktop.
- Garantia de que nenhuma alteração impacta o checkout ou o vencimento efetivo.
