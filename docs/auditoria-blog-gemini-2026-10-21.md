# Auditoria da pesquisa editorial e Gemini — 21/10/2026

Base auditada: `origin/main`, commit `1d1aa7e`. Correções preparadas em checkout isolado; nenhuma publicação, alteração de dados ou migração foi executada em produção. O checkout principal do usuário contém alterações anteriores e foi preservado.

## Fluxo rastreado

1. `/admin/blog` encaminha para `/admin/blog/agente`.
2. `EditorialResearchPanel` carrega temas e fontes do CMS. Pesquisa chama `/api/admin/news-agent/research`, protegido por `assertAdminApi`.
3. `researchEditorialLinks` consulta fontes RSS cadastradas e autorizadas, filtra período/tema, elimina sugestões descartadas e deduplica assuntos. **A pesquisa atual não chama o Gemini nem Google Search.** Feeds não oferecem garantia de cobertura de todo o período de 30 dias; dependem do histórico disponibilizado pelo veículo.
4. A seleção de uma notícia chama `/api/admin/news-agent/draft`. O Gemini lê a URL com URL Context, produz JSON, e o servidor sanitiza o HTML e valida o conteúdo.
5. `savePost` cria uma matéria com status `draft` no CMS; `saveEditorialBase` preserva a versão-base. A matéria fica acessível no editor administrativo.
6. `/api/admin/posts/[id]/editorial-ai` prepara ou personaliza a base. A personalização entra no formulário e depende de salvamento explícito. A publicação continua sendo uma ação separada do editor.
7. A consulta pública por slug exige `status=published`; o Admin consulta pelo identificador. O editor já oferece categoria, fonte, SEO, mídia e controles de publicação/indexação.

## Falhas corrigidas

| Problema observado | Correção |
| --- | --- |
| Região era apenas critério de ordenação | Brasil/Internacional agora restringem as fontes consultadas; Ambos mantém as duas regiões. |
| Tecnoblog, Manual do Usuário e E-commerce na Prática eram classificados como internacionais | Exceções explícitas para os veículos brasileiros com domínio internacional. |
| Sucesso de leitura de qualquer URL validava a geração | Exige sucesso de leitura da fonte escolhida, após normalização de rastreamento e fragmentos. |
| Respostas interrompidas podiam ser aceitas se ainda contivessem JSON válido | Geração editorial e cliente JSON exigem `finishReason=STOP` e excluem partes `thought`. |
| Repetição/fallback poderiam ultrapassar os 90 segundos da rota | Janela compartilhada de 65 segundos para geração da base, em vez de 55 segundos renovados por tentativa. O tempo do banco continua separado. |
| Personalização cortava silenciosamente bases acima de 24 mil caracteres | Envia a base inteira, que já está limitada a 25 mil caracteres na geração. |
| Links com UTM/fragmentos podiam gerar nova matéria da mesma fonte | Normalização antes da comparação e do salvamento. |
| Falha em preservar a base ocultava o rascunho já salvo | Resposta retorna o identificador do rascunho, `baseReady=false` e aviso de recuperação; editor permite preparar a base ausente. |
| Erros de cota na etapa de personalização apareciam como HTTP 400/erro interno | Tratamento editorial compartilhado preserva 429, Retry-After quando fornecido e mensagem legível para indisponibilidade. |
| Fonte salva podia mudar e a personalização continuar usando a base anterior | A API bloqueia a operação com 409 e orienta restaurar a fonte ou criar novo rascunho. |
| “Todos” falhava depois de cadastrar um 16º tema | Limite da pesquisa ampliado de 15 para 100 temas, mantendo a validação de temas ativos. |
| Descartes posteriores ao milésimo registro não eram consultados | Leitura paginada e ordenada dos descartes. |
| Falhas parciais de feeds eram silenciosas | A pesquisa informa quantas fontes falharam; HTML recebido como se fosse feed é rejeitado. |
| Botão sugeria que a busca era feita pelo Gemini | Rótulo alterado para “Pesquisar notícias”; Gemini permanece na geração. |

## Verificações realizadas

- 52 testes em `tests/ai/*.test.mjs` passaram, incluindo 18 casos novos para geração, rotas, região, persistência parcial, descartes, autorização e separação Admin/público.
- TypeScript (`tsc --noEmit --incremental false`) passou.
- ESLint dos arquivos modificados passou.
- `git diff --check` passou.
- Consulta somente de leitura ao banco configurado confirmou as tabelas `blog_ai_research_topics`, `blog_editorial_ai_bases` e `blog_editorial_dismissed_suggestions`. A tabela de descartes estava vazia; isso não é falha de acesso.
- Banco retornou 41 fontes ativas: 34 RSS, três páginas e quatro sitemaps. A pesquisa nova usa somente as fontes RSS.
- Verificação HTTP dos feeds: 33 de 34 responderam com RSS/Atom; Search Engine Land respondeu 403 neste ambiente. É um bloqueio externo, não prova de indisponibilidade permanente. Nenhuma fonte foi desativada no banco.
- Rotas revisadas exigem autenticação antes de consultar o provedor ou persistir dados. Migrações das tabelas editoriais habilitam RLS e restringem acesso a `service_role`.
- Teste local com fixture confirmou que o mesmo rascunho é acessível pela consulta administrativa e não pela consulta pública. Não foi criado conteúdo público para testar.

## Limitações e pontos restantes

- `GEMINI_API_KEY` está ausente no ambiente local disponível. Não houve geração real, verificação de cota da chave de produção nem confirmação da disponibilidade efetiva de cada modelo. Catálogo documentado não garante acesso/cota/gratuidade da conta.
- Não foi feito deploy, build completo ou teste visual em navegador/mobile. Testes da geração usam respostas simuladas; a leitura real dos feeds e das tabelas foi verificada separadamente.
- A revisão automática bloqueou consultar no site público um slug de rascunho obtido com a credencial de serviço, por considerar divulgação de metadado privado. Essa tentativa não foi executada; foi substituída pelo teste local de separação das consultas.
- Deduplicação de rascunhos ainda é uma verificação antes da escrita: não constitui exclusão mútua entre dois administradores/requisições concorrentes. Também depende do alcance de `listAllPosts`, que não pagina. Para garantia forte em grande volume, será necessário definir uma chave editorial de importação e transação/idempotência no banco, preservando matérias existentes que compartilham fontes.
- `savePost` grava matéria e tags em operações separadas. A recuperação da falha posterior de cópia-base foi corrigida, mas o salvamento global do blog não se tornou transacional nesta revisão.
- Alterações de fonte ainda não salvas no formulário não são a fonte usada pelo servidor: salve antes de pedir geração. Trocar a fonte de uma base preservada exige outro rascunho; isso evita atribuir fatos antigos à nova fonte.
- Confirmação de leitura e sanitização não comprovam a exatidão dos fatos gerados. Revisão editorial continua necessária antes de publicar.

## Referências técnicas consultadas

- [Gemini generateContent — resposta e finishReason](https://ai.google.dev/api/generate-content)
- [Gemini URL Context](https://ai.google.dev/gemini-api/docs/url-context)
- [Supabase — segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api)
- Documentação instalada do Next.js: Route Handlers e `maxDuration`.
