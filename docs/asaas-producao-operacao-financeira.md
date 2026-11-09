# Asaas produção: revisão financeira e operação segura

Status: **não habilitar checkout Asaas ainda**. Este documento descreve a operação pretendida no PR #97; não ativa nenhum recurso.

## 1. Ativação e renovação
- Criar checkout somente para usuário autenticado e reserva transacional sem assinatura ativa incompatível.
- Uma URL de checkout gerada e o evento CHECKOUT_PAID não concedem acesso.
- Exigir PAYMENT_CONFIRMED ou PAYMENT_RECEIVED validado em GET /payments/{id}, assinatura vinculada com origem, ciclo e valor esperados, além de RPC idempotente.
- Nunca conceder dois períodos com o mesmo provider_payment_id.
- Uma segunda notificação para o mesmo evento finalizado deve receber 200 sem novo efeito.
- O primeiro vencimento foi provisoriamente definido para +70 minutos no fuso America/Sao_Paulo, após a janela de validade do checkout de 60 minutos (+10 min de margem). Isso evita uma data de vencimento passada enquanto o checkout ainda é válido, mas NÃO garante cobrança imediata na contratação. Aprovar a política comercial e validar a semântica do provedor antes de ativar para clientes.


## 1.1. Política da primeira cobrança e webhooks (auditoria 2026-11-09)
- Fonte oficial: https://docs.asaas.com/docs/checkout-com-assinatura-recorrente
- O Checkout RECURRENT cria a assinatura após a conclusão da jornada; `subscription.nextDueDate` define a primeira cobrança. A conclusão do Checkout e a criação da assinatura NÃO equivalem à confirmação de uma cobrança recorrente específica.
- O código atual estabelece provisoriamente primeiro vencimento +70 minutos em America/Sao_Paulo, para exceder os 60 minutos de validade do checkout. A documentação não garante que o cartão seja cobrado imediatamente após a conclusão do checkout, nem que +70 minutos seja comercialmente apropriado. O cliente não deve receber promessa de ativação imediata.
- O Kivai deve continuar com acesso pendente até um `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` verificado em `GET /payments/{id}`, vinculado à assinatura e registrado por RPC idempotente.
- Em uma eventual liberação comercial, a política explícita precisa escolher entre cobrança no dia da contratação e cobrança em uma data futura, considerando que `nextDueDate` determina o primeiro vencimento. Não aprovar +70 minutos como regra definitiva sem validação controlada.
- Fonte oficial para eventos de checkout: https://docs.asaas.com/docs/eventos-para-checkout. Eventos de checkout esperados: `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`. O webhook de assinaturas deve contemplar `SUBSCRIPTION_CREATED`; o webhook financeiro deve cobrir os eventos de cobranças necessários.
- A confirmação de que os webhooks estão cadastrados e habilitados no painel Asaas permanece **não verificada**. Nenhum endpoint de configuração do provedor foi executado e nenhuma credencial foi usada para chamadas financeiras.
- A auditoria somente-leitura da Vercel encontrou metadados de `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` e `ASAAS_ENVIRONMENT`, porém não identificou as flags de ativação `KIVAI_ASAAS_PRODUCTION_ROUTE`, `KIVAI_ASAAS_PRODUCTION_CHECKOUT`, `KIVAI_ASAAS_PRODUCTION_LIFECYCLE` e `KIVAI_ASAAS_RECURRING_SYNC`. Isso mantém os caminhos desabilitados por configuração, mas não prova a ausência de webhooks no painel externo.
- Para verificação futura: comparar URL real dos webhooks aos endpoints `/api/billing/asaas/production-lifecycle` e `/api/billing/asaas/webhook`; conferir os eventos inscritos, token de autenticação, status habilitado, número de tentativas/reentregas e correspondência de ambiente. Nunca colar tokens em issues ou logs públicos.

## 2. Cancelamento de renovação
- Pedidos do usuário são administrativos, não executam cancelamento financeiro automaticamente no provedor.
- Operador deve verificar a identidade, contrato, termos aceitos, data de vigência e situação da renovação antes de efetuar ação no Asaas.
- Não cancelar nem alterar uma assinatura preexistente do InfinitePay ou de outro provedor como efeito de evento Asaas.
- Registrar motivo, operador, momento, IDs externos e evidência do resultado, sem dados sensíveis de cartão.

## 3. Estorno, contestação e inadimplência
- PAYMENT_REFUNDED, PAYMENT_PARTIALLY_REFUNDED, PAYMENT_CHARGEBACK_REQUESTED,
  PAYMENT_CHARGEBACK_DISPUTE, PAYMENT_OVERDUE e SUBSCRIPTION_INACTIVATED/DELETED
  devem ser registrados e enviados para revisão humana, nunca tratados como pagamento.
- Consultar o status atual na API do Asaas, o ledger de cobranças, o período vigente e o contrato.
- **Não revogar acesso automaticamente**: política de carência, contestação, devolução e cancelamento ainda precisa de aprovação.
- Também não conceder novo acesso com pagamento cujo status atual já seja REFUNDED ou outro não pago.

## 4. Resolução de incidentes
- Nunca repetir automaticamente POST /checkouts após timeout ou resposta ambígua. Conciliar por externalReference e ID do checkout.
- Em falha de gravação do webhook, responder com falha transitória para permitir redelivery; não reportar como aplicado sem ledger durável.
- Uma fila de manual_review exige ação operacional com trilha de auditoria, e não significa problema resolvido.
- Antes de habilitar os webhooks, confirmar painel Asaas, token exclusivo, eventos assinados, credenciais server-only e monitoramento de falhas.

## 5. Gate de liberação
- npm run test:billing aprovado no commit candidato.
- Build TypeScript/Next.js validado independentemente; verificar o bloqueio atual de rate limit na Vercel.
- Conferência de migrações/RLS e permissões em produção, sem DDL automática.
- Política financeira e fluxos administrativos aprovados.
- Teste real de cobrança somente mediante autorização explícita e com impacto financeiro conhecido.
- PR #97 revisado e aprovado antes de merge, mantendo todas as flags desligadas.
