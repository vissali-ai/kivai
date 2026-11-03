# Stories públicos do Instagram

O backend aceita `/stories/perfil/` (todos os Stories ativos) e
`/stories/perfil/id/` (um item). A grade usa os mesmos tokens assinados e o
mesmo proxy de mídia já usados para fotos e Reels. Cada item tem prévia e
download individual; no celular também há compartilhamento nativo.

## Ativação

1. Crie uma chave no provedor [SaveAPI](https://saveapi.org/en/docs/).
2. Configure `KIVAI_STORIES_API_KEY` nas variáveis **do serviço backend no
   Railway**, ambiente production. Não use uma variável `NEXT_PUBLIC_*`.
3. Publique o backend e o frontend e valide um perfil com Stories ativos,
   um Story específico e um perfil sem Stories. Confirme o download de
   imagem e vídeo, e a edição da ferramenta no Admin → Site.

Sem a chave, permanece a consulta do HTML público do Instagram, que pode
exigir autenticação e não é garantia de disponibilidade. A integração com
o provedor precisa ser validada com uma chave real antes de ser anunciada
como operacional. Não utiliza cookies pessoais do visitante.

## Contrato e custos

`GET https://api.saveapi.org/v1/instagram?url=...`, autenticação Bearer.
O array `medias` mantém a ordem retornada; não há corte de 20 itens para
Stories. Os links do provedor passam pelo proxy que valida HTTPS, DNS
público, tipo de mídia, limite de tamanho e redirecionamentos.

Segundo a documentação consultada, Stories consomem créditos por consulta.
Confirme os valores no painel antes de ativar. Nenhuma compra automática,
recarga ou assinatura é configurada por esta integração. Erros de chave,
quota e respostas internas nunca são enviados ao visitante com detalhes
sensíveis. A chave não é incluída em tokens de download.

## Validação local

`python -m unittest backend.tests.test_instagram_downloader backend.tests.test_instagram_stories_provider -v`

Os testes de contrato simulam o provedor; não comprovam disponibilidade
real. A validação de produção exige a chave e Stories ainda ativos.
