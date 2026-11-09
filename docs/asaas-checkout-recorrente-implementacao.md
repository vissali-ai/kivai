# Asaas Checkout recorrente: fase preparatória

## Estado
- **NÃO ATIVADO:** não existe rota pública para criar Checkout Asaas, nem troca do fluxo InfinitePay.
- Código experimental na branch de revisão: validador de payload e transporte que aceita **somente** sandbox.
- `KIVAI_ASAAS_SANDBOX_CHECKOUT` deve permanecer ausente (ou `false`) até ter persistência dos checkouts e reconciliação dos webhooks.
- `ASAAS_SANDBOX_API_KEY` é diferente da `ASAAS_API_KEY` usada em produção. Nunca utilizar a chave de produção para testes.
- `ASAAS_ENVIRONMENT=production` e `KIVAI_ASAAS_RECURRING_SYNC` não devem ser alteradas por esta fase.

## Premissas verificadas na documentação do Asaas
- `POST /v3/checkouts` cria um checkout hospedado, não confirma pagamento.
- `chargeTypes: [RECURRENT]` + `billingTypes: [CREDIT_CARD]` exigem `subscription.cycle` e `subscription.nextDueDate`.
- O retorno de criação inclui um ID de checkout. É necessário persistir o ID junto à referência externa.
- Eventos `CHECKOUT_PAID` e `SUBSCRIPTION_CREATED` precedem a conciliação de cobranças recorrentes.
- O redirecionamento de sucesso do browser **não** representa confirmação de pagamento.

## Próxima implementação obrigatória antes da primeira compra
1. Criar `kivai_asaas_checkout_intents` com chave única de referência externa, ID do usuário autenticado, plano, ciclo, preço calculado no servidor, ID do checkout, timestamps, status e dados mínimos para conciliação. Habilitar RLS e limitar acesso de escrita ao `service_role`.
2. Criar endpoint autenticado e restrito a sandbox: consultar plano/preço reais em `subscription_plans`; bloquear conta com contrato ativo ou outra compra pendente; usar operação transacional e idempotente de reserva antes de qualquer chamada financeira.
3. Criar checkout no Asaas sem repetir `POST` automaticamente em caso de timeout. Registrar `checkout.id` antes de exibir link, obter URL somente do modelo oficial do Asaas.
4. Criar webhooks autenticados de checkout e assinatura; conciliar ID e `externalReference` com uma única conta; comparar cliente, ciclo e preço na API antes de vincular `kivai_recurring_provider_links`.
5. Só o evento de cobrança confirmado, consultado de novo no Asaas, poderá chamar `kivai_apply_asaas_paid_charge`. Nunca conceder plano por retorno do navegador.
6. Definir fluxo de cancelamento, reembolso, vencimento e revisão manual; registrar métricas e testes de concorrência, duplicação e eventos fora de ordem.
7. Validar tudo em sandbox, com usuários de teste, e revisão explícita antes de habilitar a integração em produção.

## Observações
A implementação deste PR é **prévia técnica**, não uma integração ponta a ponta. A transição financeira não está pronta. Testes locais são mockados e não comprovam pagamentos reais.

Fontes:
- https://docs.asaas.com/docs/checkout-com-assinatura-recorrente
- https://docs.asaas.com/reference/criar-novo-checkout
- https://docs.asaas.com/docs/eventos-para-checkout
