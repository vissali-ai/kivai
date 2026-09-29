# Publicação das melhorias — 29/09/2026

Versão integrada sobre `bfb0b98663a8e0006aeb90348418c498f3bcd99e`, preservando
as alterações já existentes em produção (blog, tráfego, calculadora, TikTok,
áudio para YouTube e montagem de PDF).

A integração preserva 75 ferramentas no catálogo e as 20 rotas atuais do
backend. As rotas TikTok foram mantidas em `backend/api/tiktok.py`; a referência
OpenAPI foi comparada à versão remota antes de ser atualizada. O teste de
Instagram acompanha a renomeação do extrator de metadados no remoto.

Publicação inclui as melhorias de ferramentas, refatorações e integração do
CMS das etapas 1 a 4. Arquivos temporários e alterações locais anteriores desta
conversa não foram incluídos. Não há migração ou escrita de conteúdo no banco.
A consulta de arquivamento foi verificada no banco real somente por leitura.

Os relatórios das etapas documentam as contagens e limitações na data em que
cada etapa foi executada; o catálogo atual inclui duas ferramentas adicionais
que já estavam publicadas no remoto.

Validação final: build aprovado; 40 testes de ferramentas em desktop/celular,
1 teste de arquivamento no navegador, 6 testes de CMS e 26 testes Python
aprovados. Lint sem erros (9 avisos conhecidos de imagens).
