# Auditoria de cobrança Kivai, 09/11/2026

Escopo: varredura na árvore e no código da branch `main` do repositório `vissali-ai/kivai`. Não inclui histórico de cobranças não registrado no repositório nem contratos privados feitos por WhatsApp, e-mail ou sistemas externos.

| Classe | Código identificado | Cobrança atual | Recomendação |
|---|---|---|---|
| Plano Pro/Agency mensal/anual | `app/api/account/subscription-request/route.ts`, `components/account/plans-client.tsx` | Links InfinitePay e ativação administrativa | Asaas recorrente após testes E2E; gestão de cancelamento, upgrade/downgrade e reconciliação |
| Créditos de IA | `app/api/ai/credits/*`, `lib/ai/credit-purchases.ts` | Checkout avulso InfinitePay; confirmação em `/payment_check` e RPC `grant_ai_credit_order` | Preservar compra única e confirmação idempotente; oferecer histórico de compras |
| Pacotes de IA | `lib/ai/packs.ts` | Inicial: 50 créditos R$9,90; Profissional: 150 créditos R$19,90; Agência: 400 créditos R$39,90 | Controlados por `AI_CREDIT_SALES_ENABLED`; não presumir venda habilitada |
| Serviços sob orçamento | `app/servicos/*`, `lib/business-services.ts`, `lib/site-cms/service-repository.ts` | CTA para solicitação, orçamento ou WhatsApp | Após contrato, emissão de cobrança avulsa ou recorrente opcional, nunca automática por abrir página |
| Integração anterior SumUp | `app/api/billing/sumup/*`, `lib/billing/sumup.ts` | Código de checkout/assinaturas existente; uso efetivo depende de configuração e rotas consumidoras | Não apagar enquanto houver contratos legados |
| Rotinas de expiração | `app/api/cron/billing-renewals/route.ts` | Rotina de manutenção e vencimento de acessos | Integrar cancelamentos sem remover acessos vigentes indevidamente |
| Asaas | `app/api/billing/asaas/webhook/route.ts`, tabelas `kivai_recurring_*` | Infraestrutura instalada; sincronização desligada | Checkout, intenção persistida, webhook conciliado, cancelamento e pagamento confirmado antes do go-live |

## Serviços listados no repositório
- Social Media
- Gestão de Tráfego Pago
- Divulgação para Artistas e Bandas
- Criação de Landing Pages
- Automação de Processos
- Presença Local no Google
- Criação de E-commerce e Loja Virtual
- Criação de Loja Virtual
- SEO Local
- Dashboards e Relatórios
- Sistemas e Automações Personalizadas
- Consultoria para E-commerce (rota específica)

Páginas CMS podem conter outros serviços cadastrados dinamicamente; esta varredura não comprova todos os contratos e formas de cobrança que existam fora do código.

## Política segura de mudanças de plano
- Cancelar assinatura não significa estornar pagamento, nem remover acesso imediatamente. Cancelar no provedor e manter acesso até a data de término confirmada.
- Upgrade Pro → Agency: informar diferença proporcional, exigir autorização e pagamento confirmado antes de conceder nível Agency; não gerar assinatura duplicada.
- Downgrade Agency → Pro: preferir agendamento para próximo período; garantir que a alteração seja refletida no provedor.
- Pago → Grátis: após cancelar renovação no provedor, agendar mudança para o fim da vigência; se houver cobrança externa/legada, encaminhar a atendimento com confirmação.
- Créditos: compra pontual, sem renovação; nunca creditar por redirecionamento de navegador.
- Serviços: orçamentos e faturas isolados; recorrência apenas quando contratada expressamente, separada do plano Kivai.
- Estornos, chargeback e pagamentos vencidos: revisar eventos e regras de acesso antes de automação.

## Entrega desta etapa
- `GET /api/account/billing-overview`: autenticação via Supabase Auth, leitura somente do usuário, cabeçalho sem cache, sem mutação.
- `/conta/cobrancas`: consulta do plano, dos registros de compra avulsa, links para planos, créditos, serviços e suporte.
- Não existe botão de cancelamento automático nesta fase, para evitar falsa confirmação de cancelamento em Asaas/InfinitePay/SumUp.
- Não altera gateways, webhooks, banco de produção, configurações ou preços.

## Pendências
1. Validar testes automáticos e build em PR.
2. Implementar controle de assinatura em Asaas com operação de cancelamento/alteração de nível idempotente e auditada.
3. Implementar checkout com `externalReference` persistida e associação transacional usuário↔assinatura↔pagamento.
4. Criar faturamento de serviços apenas após especificação dos contratos e regras de cobrança; orçamento personalizado não equivale a auto-compra.
