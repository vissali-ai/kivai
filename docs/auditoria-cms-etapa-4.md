# Etapa 4 — Catálogo, Admin e páginas públicas

## Falha encontrada e corrigida

Cinco ferramentas de arquivos e o removedor de metadados eram mantidos em
listas separadas do catálogo consumido por `listManagedSiteContents`. Por isso,
podiam aparecer no site e passar em `audit:tools` sem aparecer no Admin.

As seis ferramentas foram incorporadas a `lib/tools.ts`. Os hubs, o diretório,
a busca e o sitemap passam a consumir esse cadastro, sem listas adicionais
que dupliquem os registros. Os módulos antigos de catálogo agora apenas
derivam seus dados da fonte central.

A auditoria deixa de aceitar cadastros independentes como substitutos do
catálogo do Admin: verifica 73 ferramentas disponíveis, 73 rotas e 73 URLs
indexáveis na configuração padrão do código.

## Integração editorial

- As seis ferramentas possuem entrada virtual no Admin antes de qualquer
  gravação no banco; o primeiro salvamento cria o registro persistente.
- As ferramentas de arquivos recebem o hub `arquivos`, quando cadastrado.
- O conteúdo editorial original das seis ferramentas está disponível no editor.
- As seis rotas consultam os metadados publicados no CMS, preservando seus
  metadados anteriores quando não existe edição publicada.
- As preferências de indexabilidade e sitemap deixam de ser contornadas pelas
  listas especiais dessas ferramentas.

## Verificação local

- `npm run audit:tools`: 73/73/73 coerentes.
- `npm run test:cms`: três testes, com os módulos reais do catálogo, repositório,
  API do Admin, SEO e sitemap. O transporte Supabase e a autenticação são
  substituídos no teste; nenhuma credencial ou dado de produção é usado.
- A suíte verifica a presença das ferramentas no Admin, abertura dos seis
  registros pela API, conteúdo editorial, hub, edição de SEO e alternância das
  preferências de sitemap sem duplicação.
- `npx playwright test tests/tools/cms-catalog.spec.ts`: quatro casos aprovados
  em desktop e emulação de celular, cobrindo as seis rotas e os hubs/diretório.
- TypeScript e build de produção aprovados; ESLint dos arquivos alterados sem
  erros ou avisos.

## Alcance e próximos pontos da auditoria

Esta entrega corrige a ausência no catálogo e a integração editorial/SEO das
seis ferramentas. Não representa uma validação completa de todos os campos
do CMS nem de todos os serviços, hubs e conteúdos do site.

Ainda precisam de verificação específica a propagação de título/resumo para
os formulários e cards estáticos, mudanças de categoria, remoção de ferramentas
arquivadas das listagens estáticas e edição de mídia/tutorial. A sessão autenticada do Admin com
persistência no banco real também não foi exercitada. Não houve deploy nem
alteração de conteúdo publicado.

## Continuação — arquivamento e revalidação

Todas as 73 rotas de ferramenta usam `getToolMetadataAsync`. Esse ponto agora
consulta o estado de arquivamento e aciona `notFound()` antes de fornecer os
metadados. Republicar restaura a página; o rascunho de uma ferramenta existente
continua preservando a versão original, sem publicar as alterações do rascunho.
Isso mantém a convenção que o sitemap já utilizava para esses rascunhos.

A consulta de visibilidade seleciona somente os slugs arquivados e compartilha
o cache de cinco minutos entre as ferramentas. Leituras de conteúdo privado
e gravações continuam com `no-store`. Falhas de consulta não são interpretadas
como permissão para reabrir uma ferramenta arquivada.

Criar, editar e excluir conteúdos ou hubs no Admin agora invalida o layout raiz
e o sitemap. A abrangência cobre menus, rodapé e páginas dependentes, inclusive
URLs anteriores após renomeação. A regeneração acontece nas próximas visitas;
isso aumenta o trabalho de regeneração após edições do CMS, sem invalidar o
site em acessos normais.

Validação adicional: seis testes de CMS aprovados; teste de navegador executado
contra Next.js e um substituto local somente de leitura para o Supabase também
aprovado; TypeScript, lint e build aprovados. O teste confirma que a página
arquivada não oferece o upload e contém `noindex`, enquanto uma ferramenta
ativa mantém resposta 200 e o controle de upload. Com streaming, o Next.js pode
ter enviado HTTP 200 antes de renderizar a tela de não encontrado; não se afirma
que todos os acessos arquivados retornam HTTP 404.

```powershell
npm run test:cms
npx playwright test --config playwright.cms.config.ts
```

O teste de navegador inicia seu próprio Next.js e banco simulado nas portas
3102 e 3198. Execute sem outro `next dev` usando o mesmo diretório `.next`.
