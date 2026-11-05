# Fase 2 — retenção e renovação (05/11/2026)

## Entrega em revisão
- Formulário opcional e compacto na conta de usuários com histórico Pro/Agency; não cancela assinatura.
- Respostas validadas no servidor, vinculadas ao usuário autenticado, sem alteração de plano, com comentário opcional limitado e intervalo mínimo entre respostas.
- Armazenamento na tabela `customer_marketing_events`, já existente, sem migração.
- Relatório administrativo em `/admin/assinaturas/feedback`: motivos agregados e comentários recentes.
- Aviso de vencimento/prorrogação no painel para períodos próximos do fim e históricos sem acesso pago.
- Nenhuma alteração nos links de pagamento, checkout, preço, status de assinatura, crédito, RLS, benefícios ou fluxo de confirmação administrativa.

## Situação do fluxo financeiro atual
- O checkout público de Pro e Agency em `app/api/account/subscription-request/route.ts` usa links de planos da InfinitePay.
- O sistema registra uma solicitação e depende de conferência administrativa do pagamento para ativar/renovar.
- A rotina `/api/cron/billing-renewals` já contém lembretes de vencimento, expiração, cortesia e retentativas de e-mails; esses fluxos não foram duplicados.
- A API pública de Checkout Integrado da InfinitePay não disponibiliza o gerenciamento de Planos e Recorrência, nem eventos documentados de cobrança de assinatura para integração de status no Kivai. Portanto, nenhum webhook ou renovação automática foi criado artificialmente nesta fase.
- Cartão recorrente e Pix Automático podem existir nos produtos de cobrança da InfinitePay, mas **cobrança no provedor** e **ativação automática de acesso no Kivai** são eventos distintos. Não ativar sem comprovação.
- Para a integração automática completa é necessário um caminho oficial documentado para receber/consultar cada cobrança recorrente e vincular assinante, ciclo, valor e evento, ou escolher outro provedor com assinaturas gerenciáveis por API. Até lá, conciliação permanece administrativa.

## Métricas a acompanhar
- Usuários com acesso pago ativo (validade efetiva, não apenas plan_code).
- Respostas por motivo e por plano (não inferir cancelamento a partir da pesquisa).
- Testes e acessos sem renovação, separadamente dos assinantes pagantes.
- Conversão de cobrança informada para pagamento confirmado e tempo até ativação.
- Volume de avisos enviados, falhas de entrega e reativações.

## Testes antes de produção
- Build e TypeScript, telas pública e autenticação grátis/Pro/Agency, mobile.
- API de feedback: sem autenticação, sem histórico, motivo inválido, payload extenso, resposta duplicada, resposta válida.
- Garantir que envio de feedback não altera nenhum status de pagamento ou assinatura.
- Conferir filtros e visibilidade em /admin/assinaturas/feedback.
- Testar avisos de vencimento, expiração de teste e período distante do fim.
- Validar integração e limites atuais antes de tornar qualquer cobrança recorrente plenamente automática.
