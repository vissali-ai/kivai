# Auditoria de planos e oportunidades — 30/09/2026

Atualização: a implementação posterior está documentada em `docs/implementacao-planos-pro-agency.md`. Os achados abaixo registram o estado anterior às correções.

## Escopo e evidência

Revisão do código local e execução das ações reais TypeScript com banco, autenticação administrativa e e-mail substituídos por mocks. Comando: `node --test tests/billing/plan-flow-audit.test.mjs`. Resultado: 7 testes passaram, incluindo reprodução explícita de defeitos. Isso não significa que esses defeitos foram corrigidos.

Não foram alterados clientes, pagamentos, banco remoto ou código funcional. Não houve validação visual autenticada nem confirmação das políticas RLS, triggers e schema implantados. As migrations locais não contêm a definição completa das tabelas de assinaturas e perfis; portanto, eventuais proteções adicionais do banco de produção permanecem não verificadas.

## O que o cliente vê

| Situação | Painel /conta | Área /conta/pro | Analisador |
| --- | --- | --- | --- |
| Grátis | Identificação Grátis, acesso ao analisador e oferta de planos; sem cartão da Área Pro | Bloqueio e convite ao upgrade | Até 50 mil seguidores; sem salvar histórico privado |
| Pagamento informado | Continua no plano anterior; contratação aguardando confirmação | Mantém acesso anterior | Mantém limites anteriores |
| Grátis convertido em Pro | Após recarregar, identificação Pro e cartão Área Pro; solicitação confirmada deixa de aparecer como pendente | Perfis, validade, histórico e contadores; até 5 perfis | Até 500 mil seguidores por perfil; armazenamento e comparação de exportações |
| Agency | Após recarregar, identificação Agency e cartão Área Agency | Mesmo componente e endereço da Área Pro, com título Agency e até 20 perfis | Sem teto numérico de seguidores nesse código; sujeito à capacidade do navegador |

O upgrade não migra automaticamente uma análise gratuita para o histórico. O usuário deve importar uma exportação no plano pago; a primeira estabelece a referência e a seguinte permite comparação. Não existe coleta contínua automática do Instagram: a atualização depende de novas exportações da Meta.

O painel principal mantém quase todo o mesmo conteúdo entre planos, inclusive a oferta de planos. O cartão de acesso pago vem depois do painel. A experiência Agency não constitui um sistema separado de gestão de clientes ou equipes. O histórico exibe identificadores dos perfis; não encontrei nesses componentes uma entrega específica de relatórios personalizados por cliente compatível com uma interpretação mais ampla da promessa comercial.

## Confirmação versus alteração manual

`app/admin/assinaturas/actions.ts`, `confirmSubscriptionPayment`: verifica Admin, lê a solicitação pendente, cria/atualiza assinatura, atualiza perfil, marca solicitação ativa, prepara onboarding e e-mail, registra evento e revalida páginas. Grátis → Pro, Grátis → Agency e Pro → Agency foram exercitados localmente com sucesso no caminho normal. Reconfirmar sequencialmente a mesma solicitação é recusado.

`app/admin/usuarios/actions.ts`, `updateCustomerAccount`: altera o perfil, mas não sincroniza assinatura, ciclo, vencimento ou solicitação pendente. Reproduzido: perfil Agency com assinatura Pro. Como o acesso usa `user_profiles.plan_code`, o cliente recebe permissões Agency enquanto a validade exibida pode continuar sendo da assinatura anterior, ou ficar sem data quando não há assinatura.

## Problemas e prioridade

1. **Alta — alteração manual inconsistente.** Unificar concessão manual, confirmação e revogação em uma regra explícita de acesso. Concessão administrativa precisa ter validade/origem própria; não deve representar pagamento que não aconteceu.
2. **Alta — gravações não atômicas.** Falha no PATCH do perfil deixa assinatura ativa, cliente grátis e solicitação pendente. Usar transação no banco, idempotência e controle de concorrência. A verificação inicial de status sozinha não protege duas confirmações simultâneas.
3. **Alta — erro após ativação.** Onboarding desativado gera exceção depois de assinatura/perfil/solicitação estarem ativos. Separar conclusão financeira do envio, com fila e retentativa; mostrar claramente “plano ativado, comunicação pendente”. Reproduzido em teste.
4. **Alta — validade depende de sincronização externa.** Painel, leitor de plano e API da configuração paga consultam o plano do perfil sem validar vencimento/status da assinatura. O cron local trata apenas `sumup_external`; `admin_test` e `admin_grace` não entram nessa rotina. Verificar automações do banco implantado e centralizar resolução de permissões por validade.
5. **Média — painel aberto não acompanha ativação.** Os componentes carregam dados uma vez no mount, sem polling, evento ou atualização ao voltar à aba. Revalidação no Admin não transmite o novo plano à sessão do cliente. Atualizar dados ao recuperar foco e durante contratação pendente.
6. **Média — renovação e troca de ciclo.** Dias restantes só são preservados quando plano e ciclo coincidem. Upgrade ou mudança mensal → anual começa no momento da confirmação. Definir e comunicar tratamento do saldo. O uso de `setUTCMonth` também pode ultrapassar o mês em datas como dia 31; ajustar ao último dia válido do mês.
7. **Média — promessa e experiência Agency.** Há aumento de limites e textos, mas painel compartilhado. O CTA do analisador envia Pro à Área Pro e Agency ao painel geral. Tornar acesso consistente e oferecer organização real por cliente antes de ampliar a promessa.
8. **Verificação necessária — segurança dos limites.** Limites de perfis/seguidores aparecem no cliente; a proteção efetiva precisa ser confirmada no banco/API. Verificar RLS de propriedade, impedir alteração de plano pelo usuário e garantir cotas no servidor. Não foi comprovada uma vulnerabilidade no banco remoto.

## Vantagens adicionais usando ferramentas existentes

Proposta de produto, ainda não implementada. Preservar o uso gratuito atual e cobrar por continuidade, personalização e organização.

| Base existente | Benefício Pro proposto | Benefício Agency proposto | Esforço relativo |
| --- | --- | --- | --- |
| Calendário editorial | Calendários salvos na conta, sincronização entre dispositivos e modelos reutilizáveis | Calendário separado por cliente e visão consolidada | Médio; exige persistência e isolamento |
| Planejador de conteúdo | Biblioteca de briefings, versões e duplicação de projetos | Briefings por cliente, identidade visual e exportação personalizada | Médio |
| Compressor, conversor e redimensionador de imagens | Presets salvos e aplicação de configurações em lote | Kits de marca por cliente e pacotes padronizados de entrega | Médio; reutiliza processamento local |
| Gerador de QR Code | Biblioteca de códigos/configurações, modelos com identidade visual | Organização por cliente e geração em lote | Médio |
| Ferramentas de PDF e arquivos | Receitas de trabalho reutilizáveis, como ordenar, renomear e preparar entregas | Pacotes de entrega por cliente com padrões próprios | Médio/alto para integrar ferramentas |
| Analisador de Instagram | Comparação visual entre períodos e relatório exportável | Relatório com marca da agência e organização por cliente | Médio |

Calendário já possui CSV e armazenamento no navegador; planejador já oferece TXT, cópia e impressão. Esses recursos existentes não devem ser anunciados como novidades exclusivas. QR dinâmico com estatísticas exige redirecionamento/infraestrutura nova; não equivale a apenas salvar um QR estático. Recursos de equipe, aprovação e links compartilhados exigem permissões adicionais e devem vir depois do isolamento por cliente.

## Sequência recomendada

1. Corrigir consistência de ativação, renovação, expiração e atualização do painel; testar contas isoladas em ambiente de homologação.
2. Dar ao painel pago uma lista clara de benefícios, validade, uso dos limites e atalhos para projetos.
3. Entregar calendário e biblioteca de briefings salvos como primeiro pacote Pro; organização dos mesmos projetos por cliente como diferencial Agency.
4. Acrescentar kits de marca e relatórios; depois avaliar equipe e aprovação externa.

Centralizar permissões e cotas por recurso (projetos, marcas, clientes, exportações), separando-as dos textos comerciais. Registrar toda nova oferta/conteúdo no CMS e catálogo central: Admin deve editar título, resumo, conteúdo, SEO, posicionamento, publicação, indexação, sitemap e mídia aplicável. Lógica executável e autorização permanecem no código/servidor. Validar rota pública e entrada Admin na mesma entrega, conforme AGENTS.md.

## Validação restante antes de considerar o fluxo homologado

Em ambiente de teste, percorrer com sessões independentes de Admin e cliente: grátis → pagamento informado → confirmação Pro; grátis → Agency; Pro → Agency; troca administrativa; renovação mensal/anual; vencimento/teste/cortesia; duas confirmações concorrentes; falha de comunicação. Conferir simultaneamente o painel, o analisador, a assinatura, o perfil e a solicitação, além das políticas RLS e acesso entre usuários. Usar apenas contas sintéticas e provedor de e-mail isolado.
