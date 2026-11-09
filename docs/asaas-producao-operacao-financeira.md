# Asaas produção: revisão financeira e operação segura

Status: **não habilitar checkout Asaas ainda**. Este documento descreve a operação pretendida no PR #97; não ativa nenhum recurso.

## 1. Ativação e renovação
- Criar checkout somente para usuário autenticado e reserva transacional sem assinatura ativa incompatível.
- Uma URL de checkout gerada e o evento CHECKOUT_PAID não concedem acesso.
- Exigir PAYMENT_CONFIRMED ou PAYMENT_RECEIVED validado em GET /payments/{id}, assinatura vinculada com origem, ciclo e valor esperados, além de RPC idempotente.
- Nunca conceder dois períodos com o mesmo provider_payment_id.
- Uma segunda notificação para o mesmo evento finalizado deve receber 200 sem novo efeito.
- Revisar a política do primeiro vencimento (+5 minutos no fuso America/Sao_Paulo) com uma contratação controlada antes de ativar para clientes.

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
