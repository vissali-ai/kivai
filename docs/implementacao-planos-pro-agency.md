# Planos Pro e Agency — implementação

## Entrega

- Confirmação administrativa em uma única transação: assinatura, perfil, solicitação, evento e e-mail em fila. Confirmação repetida é idempotente; bloqueio por usuário serializa mudanças de acesso.
- Onboarding configurado no Admin é aproveitado quando disponível. Modelo desativado/ausente usa confirmação transacional básica. Falha no provedor de e-mail não desfaz o acesso; a rotina de billing tenta novamente comunicações prontas/com falha.
- Concessão administrativa exige seleção explícita e validade. Salvar observações/serviços sem marcar alteração de acesso preserva a assinatura. Concessão não declara pagamento recebido. Solicitações pendentes são mantidas para reconciliação.
- O acesso efetivo usa assinatura ativa e datas, incluindo testes e cortesias. A expiração independe do horário do cron; o cron sincroniza o perfil.
- Renovação do mesmo plano preserva o saldo de dias, inclusive mensal → anual. Troca Pro ↔ Agency começa na confirmação, sem crédito proporcional automático; essa regra está explicada antes da contratação.
- Painel consulta mudanças a cada 15 segundos enquanto visível e ao recuperar foco. Falhas de consulta aparecem na interface.
- Pro: até 30 projetos de calendário/briefing privados na conta. Agency: até 200 projetos, organizados por até 20 nomes de clientes. Salvar é explícito; projetos podem ser abertos em outro dispositivo e duplicados.
- Ao vencer, abrir/exportar/excluir projetos continua permitido. Novos salvamentos exigem plano válido. Após downgrade Agency → Pro, projetos de clientes ficam somente para consulta; podem ser copiados como projetos pessoais respeitando a cota.
- Permissões de edição do perfil impedem alteração de plano/campos administrativos pelo usuário. Limites de Instagram e projetos são verificados no banco. Projetos têm isolamento por proprietário e controle de revisão para impedir sobrescrita de outra aba.
- `/planos` registrado no CMS, com título, resumo, texto, SEO, publicação, indexação, sitemap e campos de descrição/benefícios por plano e tutorial. Serviço explicativo `/servicos/planos-kivai` usa o CMS existente. Os dois recursos reaproveitados já pertencem ao catálogo central; seu conteúdo editorial foi atualizado.

## O que não faz parte deste pacote

Kits de marca, processamento em lote, QR dinâmico, relatórios com marca da agência, membros de equipe e aprovação por clientes não foram anunciados nem liberados. “Clientes” neste pacote são uma organização privada dos projetos, sem logins ou compartilhamento externo. Serviços executados por profissionais permanecem separados da assinatura.

## Verificações

- `npm run test:billing`: PostgreSQL isolado via PGlite, executando a migration real; testes das Server Actions com fronteiras remotas substituídas.
- `npm run test:cms`: regressão do catálogo e publicação existente.
- `npm run test:billing:browser`: Next real → APIs/Server Actions reais → adaptador HTTP local → PostgreSQL isolado. Confirma pagamento de conta sintética, observa upgrade no painel, salva e recupera calendário, concede Agency, salva briefing por cliente, abre página pública e entrada CMS. Inclui verificação mobile.
- TypeScript e lint dos arquivos de cobrança/painel modificados.
- `npm run build`: passou com banco/env de e-mail desativados; primeira tentativa sem rede falhou ao baixar Google Fonts, repetição com rede passou.
- A execução de lint da pasta inteira encontrou erro preexistente em `components/account/reset-password-form.tsx`; esse arquivo não foi alterado. Lint direcionado aos arquivos desta entrega passou.

Os testes não enviam e-mails nem modificam clientes reais. O adaptador HTTP é exclusivo dos testes e não deve ser usado em produção.

## Publicação

A migration `supabase/migrations/20260930234728_plan_access_and_saved_projects.sql` foi gerada pela CLI e validada localmente. **Aplicada ao Supabase de produção em 01/10/2026, após autorização do usuário.** As permissões de execução, isolamento dos projetos e os dois registros no CMS foram conferidos. O código foi integrado sobre a versão de produção `c97e5b7`, preservando os links atuais da InfinitePay, notificações de cadastro e ajustes do analisador.

Planejar a migration e o deploy como uma entrega conjunta: o código novo depende das novas funções/tabela. A migration também registra as explicações públicas; evitar intervalo em que a oferta nova apareça sem o código correspondente. Não publicar isoladamente apenas o frontend.

Antes do rollout, conferir contas legadas com plano pago somente no perfil, sem assinatura ativa correspondente. A nova regra não inventa pagamentos ou datas para esses registros: conceder validade explícita em Admin/Usuários quando aplicável. As funções legadas de checkout automatizado SumUp não foram redesenhadas neste pacote; a contratação pública atual usa solicitação e confirmação manual.

Depois do rollout: executar a mesma sequência em contas de homologação, confirmar RLS e permissões no banco implantado, acompanhar o cron e a fila de e-mails e verificar `/planos`, `/servicos/planos-kivai` e suas entradas no Admin.


### Ajuste de publicação

A primeira tentativa no Vercel falhou ao tentar pré-renderizar `/planos` consultando o Supabase. A página agora usa `connection()` antes da leitura do CMS, inclusive nos metadados, para executar a consulta durante a requisição. Build local com configuração de produção deve passar antes da nova publicação; a entrega só está concluída após deployment READY e conferência das páginas e Admin no domínio.
