# Kivai — recorrência financeira e sincronização de acesso (05/11/2026)

## Status e decisão de arquitetura
- O site mantém **InfinitePay como checkout público**. Os quatro links atuais Pro/Agency (mensal/anual) não foram alterados.
- A InfinitePay cobra assinaturas pelo produto Planos e Recorrências, mas a API pública de Checkout Integrado não administra os planos e não expõe notificações de cada renovação desses links. Portanto, **não é seguro autorizar automaticamente o Pro ou Agency com base no link existente**.
- O Asaas suporta criação de assinaturas, cobrança no cartão em ciclos futuros e webhook para cada pagamento. Esta implementação é uma **base opt-in** para sincronizar pagamentos Asaas previamente vinculados ao usuário. Ainda **não substitui o checkout do Kivai** nem implanta a contratação automática ponta a ponta.
- Não há conta Asaas configurada nas variáveis do projeto Vercel consultadas no dia 05/11/2026.

## O que foi desenvolvido neste PR
1. Nova migração aditiva com mapeamento `kivai_recurring_provider_links`, ledger de cobranças pagas `kivai_recurring_paid_charges` e caixa de entrada dos webhooks `kivai_recurring_webhook_inbox`.
2. Webhook `POST /api/billing/asaas/webhook` com token próprio de origem (header `asaas-access-token`), limites de payload e validação de status e valor via `GET /payments/{id}`.
3. RPC transacional `kivai_apply_asaas_paid_charge`, exclusiva para `service_role`; uma cobrança ID aplica no máximo um período, mesmo com dois eventos ou múltiplas entregas.
4. Proteção contra sobrescrever acesso vigente em outro provedor. Tentativas incompatíveis ficam para revisão administrativa.
5. Painel privado `/admin/assinaturas/recorrencia` com vinculação assistida: assinatura ativa Asaas, valor e ciclo conferidos e e-mail do pagador igual ao da conta Kivai. **Vincular não libera Pro**.
6. Reprocessamento de pagamento pendente exige nova consulta à API Asaas antes de aplicar acesso.
7. Estornos e chargebacks vão para fila de revisão e **não são automaticamente revertidos** neste estágio. Para liberar produção, a política de reversão e conciliação deve estar definida.

## Operação segura para iniciar em Sandbox
1. Criar uma conta Asaas e gerar credenciais de **Sandbox** na própria conta, sem compartilhar tokens em mensagens ou commits.
2. Aplicar a migração `20261105193000_asaas_recurring_sync.sql` em banco **de teste**, nunca diretamente em produção sem validar.
3. Configurar as variáveis de ambiente no ambiente de teste da Vercel:
   - `KIVAI_ASAAS_RECURRING_SYNC=true`
   - `ASAAS_ENVIRONMENT=sandbox`
   - `ASAAS_API_KEY` (segredo, acesso somente servidor)
   - `ASAAS_WEBHOOK_TOKEN` (segredo diferente da chave de API, 32 ou mais caracteres)
4. Configurar no Asaas Sandbox um webhook apontando para `https://<host-da-previa>/api/billing/asaas/webhook` com `authToken` e eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_INACTIVATED` e `SUBSCRIPTION_DELETED`.
5. Criar manualmente uma assinatura de teste com cartão e vincular no Admin a uma **conta de teste Kivai** sem contrato vigente. Os e-mails do pagador e da conta devem coincidir, bem como preço e ciclo.
6. Simular pagamento confirmado, evento duplicado, pagamento com valor diferente, assinatura desconhecida, estorno e cobranças repetidas. Inspecionar `kivai_recurring_paid_charges`, o status de acesso e a fila de revisão.
7. Executar `npm run test:billing` e build. Revisar RLS, falhas de webhook e logs.
8. Só após testes: definir uma jornada automática de aquisição via Asaas Checkout e os processos de cancelamento, reembolso e chargeback. Não ativar para usuários reais antes dessas etapas.

## Limitações que ainda impedem usar como checkout comercial
- Não há endpoint de criação de Checkout Asaas no site nem autoassociação da assinatura ao usuário, pois é preciso garantir que a identificação do pagador e os eventos de criação do Checkout e da assinatura sejam relacionados sem ambiguidade.
- Novas assinaturas Asaas devem primeiro ser vinculadas por um administrador e a migração precisa estar instalada.
- Eventos antigos recebidos antes do vínculo podem ser conciliados individualmente no Admin.
- Não há portal de cancelamento integrado ao Asaas nem tratamento automático para estornos/chargebacks.
- A base mantém somente cartão de crédito recorrente; Pix Automático é outra modalidade técnica.
- Sem credenciais reais não foi feito teste financeiro ponta a ponta.

## Controle de risco
- Não reusar o webhook da InfinitePay de créditos de IA para assinaturas.
- O Checkout Integrado da InfinitePay aceita webhook para transações avulsas, mas isso **não** confirma cobranças do produto Planos e Recorrências.
- Não alterar `user_subscriptions` pelo browser, retorno da página de pagamento ou evento não verificado.
- Monitorar idempotência e tratamento de webhooks: o Asaas pode reenviar o mesmo ID de evento; evitar bloquear a fila de notificações em eventos que exigem conferência.
- Guardar tokens somente na Vercel; não comitar `.env`.

## Fontes verificadas
- InfinitePay Checkout: https://www.infinitepay.io/checkout-documentacao
- Asaas Checkout recorrente: https://docs.asaas.com/docs/checkout-com-assinatura-recorrente
- Asaas eventos de cobrança: https://docs.asaas.com/docs/webhook-para-cobrancas
- Asaas auth e idempotência: https://docs.asaas.com/docs/sobre-os-webhooks
