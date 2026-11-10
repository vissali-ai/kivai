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

## 6. Checklist de liberação operacional (não executado)

### Webhooks Asaas
Acesse a conta Asaas de produção, em Webhooks, e confira **sem criar cobranças**:
- Webhook de checkout e assinatura apontando para `https://www.kivai.com.br/api/billing/asaas/production-lifecycle`. Eventos necessários: `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`, `SUBSCRIPTION_CREATED`. `CHECKOUT_CREATED` é opcional e ignorado pela rota.
- Webhook financeiro apontando para `https://www.kivai.com.br/api/billing/asaas/webhook`. Eventos de crédito: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`; também monitorar reembolsos, chargebacks e inadimplência.
- Ambos devem transmitir `asaas-access-token` correspondente ao `ASAAS_WEBHOOK_TOKEN` configurado no deployment, sem publicar o token. Verificar se a fila está habilitada, não interrompida, e se URLs e eventos correspondem ao ambiente correto.
- Validar em uma contratação controlada que o Asaas preserva a referência do Checkout na assinatura criada, porque o vínculo automático exige a referência exata no `GET /subscriptions/{id}`. **Não considerar garantido sem prova do provedor.**
- Conferir o comportamento de eventos fora de ordem. O processamento inicial pode registrar `manual_review`, que não é resolvido automaticamente só porque outro evento chegou depois. É necessário definir rotina de conciliação e reprocessamento seguro antes de operar em escala.

### Flags de publicação (todas desabilitadas até autorização)
| Variável | Finalidade |
| --- | --- |
| `ASAAS_ENVIRONMENT=production` | Selecionar produção, apenas com `VERCEL_ENV=production` |
| `ASAAS_API_KEY` | Credencial secreta do Asaas (já cadastrada, valor não auditado) |
| `ASAAS_WEBHOOK_TOKEN` | Token de autenticação dos eventos (já cadastrado, valor não auditado) |
| `KIVAI_ASAAS_PRODUCTION_LIFECYCLE=true` | Permitir gravação de eventos do checkout e assinatura |
| `KIVAI_ASAAS_RECURRING_SYNC=true` | Permitir consulta de cobranças confirmadas |
| `KIVAI_ASAAS_VERIFIED_AUTO_LINK=true` | Autorizar promoção de vínculo somente com eventos e API verificados |
| `KIVAI_ASAAS_PRODUCTION_CHECKOUT=true` | Liberar transporte do Checkout API |
| `KIVAI_ASAAS_PRODUCTION_ROUTE=true` | Liberar a rota para contratação a partir de `/planos` |
| `KIVAI_ASAAS_RECONCILIATION=true` | Habilitar conciliação diária de cobranças anteriormente não vinculadas; só após validação dos webhooks |

A rotina `GET /api/cron/asaas-reconcile` é autenticada por `CRON_SECRET`, já existente na Vercel; está agendada em `vercel.json` para 07:53 UTC diariamente, mas sem a flag `KIVAI_ASAAS_RECONCILIATION` não consulta banco nem Asaas. Processa no máximo 8 eventos de pagamento previamente marcados `manual_review` e revalida na API Asaas a cobrança e assinatura, exige checkout/assinatura reconciliados no banco e rejeita pagamentos vinculados a eventos de reembolso ou chargeback. Nunca cria cobranças ou checkouts. O ledger permanece idempotente, protegendo contra concorrência e duplicidades. Casos não resolvidos continuam em revisão manual.

A rota `GET /api/billing/asaas/production-checkout` retorna apenas `{enabled:false}` enquanto faltar qualquer gate; a página de planos mantém o fluxo anterior e nunca recebe segredo. Habilitar as flags deve ser uma operação coordenada após a confirmação de webhooks e da política de faturamento, não durante testes de UI.

### Critérios de aceite antes do primeiro cliente
1. Conferir teste de fluxo com API Asaas e webhooks reais, sob autorização explícita e valor conhecido.
2. Confirmar `CHECKOUT_PAID`, `SUBSCRIPTION_CREATED` e `PAYMENT_CONFIRMED/RECEIVED` com conciliação idempotente até plano ativo, sem concessão antecipada.
3. Confirmar o que acontece com primeiro vencimento (+70 minutos é provisório), inclusive para compras próximas da meia-noite em Brasília.
4. Exercitar cancelamento e expiração de checkout e garantir liberação segura da reserva.
5. Validar recebimento de `PAYMENT_OVERDUE`, reembolso e chargeback sem aplicar novo período; definir tratamento de acesso e eventual estorno.
6. Observar o resultado do GitHub Actions no **commit final**, realizar revisão do PR e liberar o merge somente quando a integração estiver operacionalmente auditada.

## 7. Auditoria da captura de configuração Asaas (2026-11-09)
- A Vercel confirma `www.kivai.com.br` como domínio principal e redirecionamento HTTP 308 do domínio sem `www`. As URLs oficiais de webhooks e callbacks devem usar diretamente `https://www.kivai.com.br`.
- Captura de um webhook identificado como **Kivai - Assinaturas Produção**, URL de cobrança com `www`, API v3, ativo e fila sequencial ativada. A tela estava **Em edição**, então salvar e voltar à listagem para confirmar a persistência.
- Eventos financeiros visíveis selecionados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED` e `PAYMENT_CHARGEBACK_REQUESTED`; `SUBSCRIPTION_CREATED` aparece desmarcado; eventos de `Checkouts` não estão visíveis.
- **Necessários dois webhooks separados, com URLs diferentes**: o webhook financeiro deve receber eventos `PAYMENT_*`; um segundo webhook de lifecycle deve receber `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED` e `SUBSCRIPTION_CREATED`. Enviar `SUBSCRIPTION_CREATED` exclusivamente à rota financeira não efetua conciliação, pois ela não processa automaticamente esse evento.
- Confirmar que o token de autenticação dos dois webhooks corresponde ao mesmo `ASAAS_WEBHOOK_TOKEN` da Vercel. Não enviar nem exibir segredo ao suporte ou PR.
- A branch do PR #97 ainda não está publicada na URL principal; os endpoints do lifecycle e os eventos adicionais não podem ser validados em produção até um deploy aprovado, com as flags mantidas desligadas até revisão financeira.

## 8. Validação financeira restrita a uma conta (modo de teste)

Antes de iniciar uma cobrança real, ativar o piloto de uma conta:
- `KIVAI_ASAAS_TEST_ONLY=true`: só a conta explicitamente autorizada pode acessar o checkout recorrente.
- `KIVAI_ASAAS_TEST_USER_ID=<UUID>`: ID da conta **nova e elegível**, criada no Kivai especificamente para testar; sem contratos ativos nem pedidos de pagamento pendentes.
- `KIVAI_ASAAS_PUBLIC_SALES=false`: não habilitar venda geral durante testes; essa flag exige revisão separada após aceite.
- `KIVAI_ASAAS_PRODUCTION_ROUTE`, `KIVAI_ASAAS_PRODUCTION_CHECKOUT`, `KIVAI_ASAAS_RECURRING_SYNC`, `KIVAI_ASAAS_PRODUCTION_LIFECYCLE` e `KIVAI_ASAAS_VERIFIED_AUTO_LINK`: só ativar coordenadamente após validar webhook e token.
- A página de planos faz consulta autenticada de disponibilidade e **POST valida novamente o ID no servidor**; uma URL manipulada não autoriza usuários fora da lista.
- Teste de menor custo pelo checkout publicado: plano Pro mensal, preço corrente no banco **R$ 19,90** em 2026-11-09. É uma **assinatura recorrente real**, não pagamento avulso. Confirmar consentimento específico para valor, cartão, periodicidade e eventual taxa antes de executar. O vencimento inicialmente calculado como +70 minutos é provisório; conferir calendário de cobrança e prazo antes de prosseguir.
- Foi identificada uma conta com e-mail de notificações Asaas também cadastrada no Kivai, mas nela existem **duas solicitações antigas ainda aguardando pagamento**. Não usar essa conta para o piloto nem remover solicitações ou alterar contratos históricos como atalho.
- O usuário deve concluir o checkout e digitar dados do cartão **somente no ambiente hospedado pelo Asaas**. Não receber dados financeiros por chat. Acompanhar logs e entidades no Asaas e Supabase; não recriar checkout após timeout.
- Após verificação: cancelar renovação da assinatura piloto no Asaas **apenas com autorização explícita**, sem presumir que cancelamento produz estorno da cobrança já confirmada; observar política de custos e reembolsos.
- Depois do piloto: desabilitar `KIVAI_ASAAS_TEST_ONLY` apenas como parte de uma liberação pública auditada e que exija `KIVAI_ASAAS_PUBLIC_SALES=true`. Não misturar os dois controles.

### Limite técnico adicional do piloto
- Durante `KIVAI_ASAAS_TEST_ONLY=true`, o checkout aceita **somente Pro mensal**, recusando Agency e ciclos anuais diretamente no endpoint, antes de qualquer escrita ou chamada ao Asaas. Na interface, o piloto disponibiliza somente essa opção para a conta autorizada. O preço é verificado por RPC, não por conteúdo enviado do navegador.
- A conta de teste deve ter login próprio e nenhuma solicitação de pagamento pendente. Uma compra verdadeira pode iniciar renovações mensais; definir o cancelamento com o pagador após os testes e verificar eventuais taxas cobradas pelo Asaas.

## 9. Política comercial aprovada em 2026-11-10: cobrança no dia da contratação

Decisão comercial: a primeira cobrança deve ter **data no mesmo dia civil da contratação** no fuso `America/Sao_Paulo`. O acesso Pro/Agency somente é liberado após o pagamento constar como `CONFIRMED` ou `RECEIVED` na API do Asaas, reconciliado com a assinatura e a cobrança em RPC idempotente.

- O Checkout do Asaas usa `subscription.nextDueDate` para definir a primeira cobrança. Mesmo com vencimento no dia, o Asaas **pode** processar o cartão imediatamente, mas não garante aprovação ou crédito imediato. Não anunciar ativação instantânea.
- Durante o checkout de 60 minutos, a data original pode se aproximar da meia-noite de Brasília. O código conserva o buffer atual de +70 minutos e **bloqueia a criação** caso o primeiro vencimento calculado caia em outro dia civil. Isto evita prometer cobrança no dia e efetuar cobrança no dia seguinte. A verificação ocorre **antes da reserva** no Supabase, evitando intent presa.
- Limitação aprovada para preparação, ainda não solução comercial final: há uma janela próxima da meia-noite em que novas contratações não são oferecidas. Antes do lançamento público, decidir se a experiência exibirá uma mensagem de indisponibilidade temporária ou se se implementará Checkout com prazo de expiração adaptativo, sujeito a validação adicional no Asaas.
- O sistema continua proibido de conceder acesso por `CHECKOUT_PAID`, `SUBSCRIPTION_CREATED` ou redirecionamento de sucesso sem `PAYMENT_CONFIRMED/RECEIVED` validado.
- A rotina financeira descarta cobranças incompatíveis com cartão de crédito e impede concessão de acesso quando já houver evento de estorno ou chargeback registrado para a mesma cobrança.
- Os logs de produção registram casos `manual_review` sem dados de cartão ou de usuário; a fila de revisão precisa de acompanhamento operacional. Eles **não são** alertas enviados por e-mail e não substituem monitoramento automatizado.
- Conciliação de eventos fora de ordem existe em `/api/cron/asaas-reconcile`, mas **não deve** ser habilitada só com testes unitários: primeiro verificar o processamento de um pagamento real e conferir o funcionamento da rotina sob credenciais de produção.

### Portões técnicos adicionais para venda pública (não ativados)

Além dos portões anteriores, a rota do Checkout público agora exige simultaneamente:
- `KIVAI_ASAAS_TEST_ONLY=false`
- `KIVAI_ASAAS_PUBLIC_SALES=true`
- `KIVAI_ASAAS_RECONCILIATION=true`
- `KIVAI_ASAAS_PUBLIC_PAYMENT_VALIDATED=true`, a ser criada **apenas após** uma cobrança real ter ativado o período correto, haver evidência de vínculo dos eventos e uma execução controlada de conciliação
- Todas as flags de lifecycle, checkout, sincronização e link verificado configuradas corretamente.

A ausência ou valor diferente de `true` em qualquer uma dessas variáveis mantém a venda pública **bloqueada**. Em especial, `KIVAI_ASAAS_PUBLIC_PAYMENT_VALIDATED` não está autorizada agora.

### Checklist de aceite antes da aprovação do lançamento

1. Confirmar na conta Asaas o token e a entrega HTTP 200 de `CHECKOUT_PAID`, `SUBSCRIPTION_CREATED` e `PAYMENT_CONFIRMED/RECEIVED` para uma cobrança real.
2. Verificar o `provider_payment_id` no ledger e a assinatura ativa no Supabase, além de ausência de período duplicado.
3. Verificar comportamento quando os eventos chegarem fora de ordem e a conciliação resolver `manual_review` sem duplicar valores.
4. Conferir a data de primeiro vencimento em uma jornada real no mesmo dia e tratar a janela de fechamento perto de meia-noite.
5. Revisar contrato de renovação, cancelamento pelo usuário, inadimplência, estorno, reembolso, chargeback e atendimento.
6. Instrumentar alerta operacional fora dos logs da Vercel para `manual_review` e filas penalizadas, antes de escalar para muitos clientes.
7. Executar testes de gateway e rollout em condições controladas. Aprovar o lançamento em nova etapa; nenhuma mudança desta branch autoriza venda pública.

Documentação oficial consultada:
- https://docs.asaas.com/docs/checkout-com-assinatura-recorrente
- https://docs.asaas.com/docs/faq-assinaturas
- https://docs.asaas.com/docs/faq-de-webhooks
