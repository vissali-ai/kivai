# Retirada da integração SumUp, 09/11/2026

## Removido do código de aplicação
- Biblioteca de API, tokenização e renovação automática `lib/billing/sumup.ts`.
- Endpoints de início, confirmação e finalização de cobrança em `app/api/billing/sumup/*`.
- SDK do cartão no navegador e componentes exclusivos `checkout-client.tsx` e `payment-return-client.tsx`.
- A rota antiga `/conta/checkout` agora redireciona para `/planos` sem cobrar.
- O retorno antigo `/conta/checkout/retorno` mantém um aviso e um caminho para atendimento, sem usar o gateway.
- A autenticação Supabase foi copiada, sem alterar a semântica, para `lib/auth/authenticated-billing-user.ts`, e os consumidores foram atualizados.

## Não remover sem conciliação
- A base de produção contém registro legado `provider=sumup_external` em `user_subscriptions`. **Não excluir, reescrever nem cancelar registros históricos ou cobrar um cliente sem conferir o provedor.**
- `lib/billing/manual-subscriptions.ts` mantém o identificador `sumup_external` somente para continuar a rotina de vencimento de contratos legados, não para conectar ao gateway.
- Os testes de regressão da migração Asaas contêm exemplos históricos, não chamadas ao gateway.
- Migrações SQL antigas não devem ser reescritas; são registros da história do banco.
- Variáveis `SUMUP_API_KEY` e `SUMUP_MERCHANT_CODE` foram identificadas no projeto Vercel, em Production. Devem ser excluídas **após a aplicação do código validado e a confirmação de ausência de cobranças recorrentes externas pendentes**. Este PR não remove variáveis da Vercel.

## Preservado
- Checkout público atual via InfinitePay para Pro/Agency, sem alterações.
- Checkout avulso de créditos InfinitePay com verificação oficial e concessão de créditos.
- Asaas sincronização recorrente instalada no banco, desligada.
- Autenticação de usuários, IA, hospedagem, suporte, Google Ads, avaliações e demais rotas.
- Contratos e dados financeiros históricos.

## Pré-publicação
1. Rodar `npm run test:billing`, `npm run build` e regressões de login, IA, suporte, Google Ads, créditos e plano ativo.
2. Conferir se não há contratos reais ativos via SumUp, separadamente da existência de `sumup_external` no banco.
3. Após implantação validada, revogar as credenciais SumUp na própria plataforma e remover variáveis Vercel.
4. Não migrar assinantes em execução sem consentimento/conciliação de períodos pagos.
