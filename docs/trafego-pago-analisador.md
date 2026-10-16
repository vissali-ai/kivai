# Hub Tráfego Pago: Analisador de Tráfego Pago Google Ads

## Identidade aprovada
- Hub: **Tráfego Pago**.
- Ferramenta: **Analisador de Tráfego Pago Google Ads**.
- Rota canônica: `/ferramentas/analisador-de-trafego-pago-google-ads`.
- Rota anterior `/ferramentas/ads-intelligence`: redirecionamento permanente.
- Sem alterar/remover as calculadoras ROAS/ROI originais: apenas atalhos no hub.
- Não publicar nem indexar uma ferramenta como completa antes de uma revisão individual.

## Escopo obrigatório do produto
O sistema completo deverá permitir análise de **todos os tipos de campanhas suportados pela Google Ads API**, sem restringir a Pesquisa: Pesquisa, Performance Max, Display, Shopping, Vídeo, Demand Gen, Apps/Multicanal, Inteligente, Hotel, Viagens, Local e Serviços Locais, além de tratar tipos desconhecidos ou não especificados. Novas modalidades deverão ser reconhecidas sem corromper relatórios.

O diagnóstico nunca deve pressupor que todas as modalidades possuem os mesmos relatórios. Deve usar duas camadas:

1. **Núcleo comum**: campanha, período, impressões, cliques, custo, conversões, valor das conversões (quando disponível), CPA, ROAS, evolução temporal, objetivos e metas cadastradas.
2. **Adaptadores especializados**: dados, métricas e recomendações apropriados para o tipo e objetivo de cada campanha.

## Análises por modalidade

| Modalidade | Relatórios/assuntos que devem ser considerados na fase de integração |
|---|---|
| Pesquisa | Termos de pesquisa, palavras-chave, anúncios, grupos de anúncios, correspondências, relevância, conversões |
| Performance Max | `campaign`, `asset_group`, `asset_group_asset`, `performance_max_placement_view`, `campaign_search_term_view`, insights de pesquisa, canais e produtos quando disponíveis |
| Display | Anúncios, criativos, públicos, posicionamentos, cobertura e conversões |
| Shopping | Feed, produtos, grupos de produtos, custos, conversões e rentabilidade quando os dados existirem |
| Vídeo | Métricas de vídeo e engajamento, CPV, públicos, recursos e conversões quando pertinentes |
| Demand Gen | Grupos de anúncios, criativos, públicos, canais e objetivos |
| Apps / Multicanal | Instalações, eventos pós-instalação e metas do app, quando disponíveis |
| Inteligente | Campanha e consultas específicas, incluindo `smart_campaign_search_term_view` |
| Hotel, Viagens, Local e Serviços Locais | Relatórios compatíveis, objetivos de negócio e métricas próprias disponíveis via API |

**Atenção à Performance Max:** não tentar obter dados de PMax exclusivamente por `ad_group` / `ad_group_ad`. O relatório `search_term_view` também não cobre Performance Max. Para termos em nível de campanha, analisar `campaign_search_term_view` e suas limitações de segmentos. Não inferir informações indisponíveis.

Referências oficiais:
- https://developers.google.com/google-ads/api/docs/campaigns/overview
- https://developers.google.com/google-ads/api/fields/v23/campaign
- https://developers.google.com/google-ads/api/performance-max/reporting
- https://developers.google.com/google-ads/api/docs/reporting/overview

## MVP atualmente implementado nesta branch
- Hub de Tráfego Pago com atalhos existentes.
- Página do analisador com nome/URL oficiais.
- Planejamento matemático mensal editável sem afirmação de previsão do mercado.
- Importação local de relatório **CSV de campanhas**: classificação por tipo, desempenho comum, KPIs e pontos que precisam de dados adicionais.
- Importação separada de CSV de termos de pesquisa, com sinalização de candidatos à revisão (sem negativação automática).
- Exportação do planejamento e de termos de pesquisa para revisão.
- Sem persistir conteúdo das planilhas ou conectar contas por esta ferramenta.
- Página do analisador **noindex** enquanto produto estiver incompleto.

**Não implementado:** OAuth / Google Ads API, clientes persistidos no banco, Gemini conectado a este produto, inteligência contextual com fontes, relatórios profundos por tipo, análise geográfica, pesquisa de concorrentes, conectores XLSX e histórico de ações.

## Requisitos para a fase de integração
1. OAuth 2.0, contas de clientes e MCC, consulta com GoogleAdsService/SearchStream.
2. Isolamento de clientes e gestores, tokens protegidos, permissões explícitas, RLS e política de retenção de dados.
3. Planos mensais por cliente com objetivos configuráveis (leads, CPA, ROAS, receita, visitas, installs etc.).
4. Seleção de campanhas e período, identificação automática de `advertising_channel_type`, consultas por adaptador compatível e indicação de relatórios ausentes.
5. Motor determinístico de indicadores e regras + Gemini existente para explicação, hipóteses, prioridades e evidências; nunca fabricar métricas.
6. Diagnósticos e limpeza de pesquisas com revisão humana antes de negativar, pausar ou alterar orçamento.
7. Importação manual como opção de privacidade para quem não conecta a conta; dados mínimos e processamento temporário.
8. Testes e validação do Google Ads API por tipo, objetivo e limites de relatórios, incluindo divergências entre relatório e UI.

## Proteções de produto
- Sem prometer análise precisa quando faltam dados.
- ROAS depende do valor de conversão atribuída; não substituir automaticamente por faturamento total.
- Objetivos distintos requerem KPIs distintos: campanha de vídeo não é avaliada unicamente por leads.
- Qualquer alteração futura em campanhas deve exigir autorização clara do gestor.
