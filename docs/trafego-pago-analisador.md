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


## Visão funcional aprovada: copiloto operacional de gestor de tráfego

A finalidade não é apenas mostrar dados: o analisador deve organizar prioridades por cliente, detectar
desvios entre plano contratado e performance, explicar a evidência de cada alerta, sugerir o próximo
passo e recomendar explicitamente **não alterar** campanhas quando ainda não houver dados suficientes.
Os sinais abaixo são exemplos que devem ser implementados a partir de dados verificáveis, quando a
Google Ads API estiver conectada, ou de arquivos corretamente importados pelo usuário.

### Central de prioridades do cliente

Tela de cada cliente deve responder:
- Quantas campanhas existem, quais tipos, quais estão veiculando, limitadas, pausadas ou recusadas?
- Quais metas estão contratadas para o mês: teto de mídia, leads qualificados, CPL, CPA, receita
  atribuída, ROAS, instalação de aplicativo, visualização, visita à loja, ou outra conversão?
- Quanto foi investido desde o dia 1 do mês; qual o ritmo de consumo em relação à verba?
- Quantas conversões foram registradas; quais são leads de verdade? Há meta para conversões qualificadas?
- Quanto falta para a meta; qual é a estimativa condicional, com premissas explicitadas?
- Quais recomendações oficiais estão ativas e em quais delas realmente vale agir?
- Existem anúncios, palavras-chave ou recursos recusados ou com exibição limitada?
- Houve alterações recentes (lances, orçamento, palavras-chave, criativos) que exigem observação?
- O que representa oportunidade, urgência, manutenção ou pendência de dados?
- O que mudou em leilão, concorrência, dispositivos, localidade, horários e público,
  quando estes dados estiverem disponíveis e forem adequados ao tipo de campanha?

Cada insight precisa de: **nível, origem, período, evidência, meta confrontada,
hipótese, recomendação, risco, confiança, dependências, estado (pendente/feito/descartado)
e data de acompanhamento**. Não usar um score genérico para substituir as evidências.

### Núcleo de diagnóstico de resultados e orçamento

- Gasto mensal: \`sum(cost_micros)\` / 1.000.000, agrupado por mês civil no fuso da conta.
- Gasto vs. orçamento mensal do cliente: comparar o mesmo escopo (todas as campanhas incluídas no plano).
- Ritmo de gasto: só calcular projeção linear com dados do dia 1 até a data final; permitir
  curvas de investimento planejadas, sazonalidade e campanhas com orçamento específico.
- Leads vs. meta: não chamar toda conversão de "lead". Exigir mapeamento de ações de conversão.
- CPL e CPA: custo / número de resultados da ação escolhida, filtrando ações primárias
  e critérios de atribuição/qualificação quando aplicáveis.
- ROAS: valor de conversão atribuído / custo de mídia. Não confundir com faturamento total.
- Faturamento do cliente: caso venha de CRM, checkout ou upload, manter métrica separada,
  com regras de atribuição e permissão explícitas.
- Evolução: dia, semana, mês, comparação de períodos equivalentes, defasagem de conversões,
  sazonalidade e histórico de mudanças.
- Campanhas pouco maduras: olhar data real de criação e de última alteração significativa,
  estratégias de lances e volumes. **Nunca** usar "7 dias" como prazo universal de aprendizado.
- Inatividade não significa necessariamente problema: considerar metas de reconhecimento
  e presença local, não só resultados diretos.
- Não recomendar mudanças em campanhas recentes por simples oscilação. Problemas críticos
  de política, rastreamento, verba e configurações precisam de investigação imediata.

### Recomendações Google Ads com revisão contextual

- Consumir o recurso **\`recommendation\`** e, quando permitido, impacto estimado,
  tipo, vinculação a campanha/orçamento/grupo e data de coleta.
- Exibir **recomendações do Google** separadas de **recomendações do Kivai**.
- Comparar cada recomendação à meta e às restrições do cliente. Exemplo: recomendação
  de elevar o orçamento pode ser rejeitada quando excede limite contratado.
- Mostrar estados: aprovar para executar manualmente, acompanhar, descartar e reavaliar.
- MVP sempre leitura/aconselhamento. Não chamar \`ApplyRecommendation\` nem
  \`DismissRecommendation\` sem decisão explícita e controle de permissões.
- Recomendações mudam e expiram; registrar \`resource_name\`, data da consulta e
  necessidade de atualização antes de executar.

Fontes: https://developers.google.com/google-ads/api/docs/recommendations
https://developers.google.com/google-ads/api/fields/v26/recommendation

### Termos de pesquisa e oportunidades de palavra-chave

- Pesquisa: \`search_term_view\`; Performance Max: \`campaign_search_term_view\`
  (respeitar restrições de segmentos e modalidades).
- Candidatos a negativas: sem relação com a oferta, busca informacional não desejada,
  marca alheia inadequada, custo significativo sem resultado suficiente;
  fundamentar em contexto e não apenas "zero conversão".
- Candidatos a adição: consultas com conversões, intenção coerente, possibilidade
  de melhor controle de correspondência e textos específicos.
- Verificar duplicações, palavras existentes, negativas atuais, tipo de correspondência,
  proximidade semântica e canibalização antes de sugerir inclusão.
- "Limpeza" e "novas palavras-chave" são fluxos distintos; não executar automaticamente.
- Armazenar avaliação do gestor, motivo e resultado após a alteração.

### Criativos, títulos, descrições, qualidade e política

- Pesquisa: \`ad_group_ad\`, \`ad_group_ad_asset_view\` e combinações disponíveis;
  usar \`ad_group_ad.ad_strength\` e indicadores de performance por anúncio.
- Recursos: \`asset\`, \`asset_group_asset\`, \`ad_group_asset\`, campos de
  aprovação (\`policy_summary\`) e indicadores de performance quando compatíveis.
- Palavras-chave: \`ad_group_criterion\`, \`keyword_view\`,
  \`quality_info.quality_score\`, \`primary_status_reasons\`, lance efetivo,
  custo, conversões e situação de aprovação.
- Reprovação exige recomendação clara e referência à política; não fornecer técnicas
  para burlar restrições. Recurso com aprovação limitada precisa de revisão.
- Gemini poderá sugerir novas headlines e descrições **após analisar textos existentes,
  resultados, oferta, público, regras de copy e política aplicável**. Não afirmar que
  um único título "ganhou" quando o relatório não permite isolar sua contribuição.
- Recomendação criativa deve conter: texto atual, motivo, evidência, 2-3 alternativas,
  limite de caracteres e recomendação de teste com controle, evitando edições bruscas.
- "Força do anúncio" é um indicador de qualidade/completude, não sinônimo de ROAS.

Fontes: https://developers.google.com/google-ads/api/fields/v26/ad_group_ad
https://developers.google.com/google-ads/api/fields/v26/asset
https://developers.google.com/google-ads/api/fields/v26/ad_group_criterion

### Públicos, regiões e dispositivos

- Consultar segmentos compatíveis (\`segments.device\`, \`segments.date\`,
  \`location_view\`, \`ad_group_audience_view\`, \`campaign_audience_view\`).
- Cuidado com sobreposição de públicos: a soma de conversões segmentadas pode
  não representar um total incremental de pessoas.
- Comparar dados suficientes, por metas específicas, sem inferir causalidade.
- Sugerir segmentações apenas quando há relação clara com a oferta e a política.

Fontes: https://developers.google.com/google-ads/api/fields/v26/ad_group_audience_view

### Informações do leilão e novidades da concorrência

Os campos de Auction Insights (\`metrics.auction_insight_*\`) aparecem na
documentação da versão v26 mas **não estão publicamente disponíveis** para
desenvolvedores comuns. Não implementar endpoint fictício. Na primeira fase
dar opção de importar arquivos de "Informações do leilão" exportados do Google Ads.
Comparando períodos equivalentes, avaliar mudanças de participação, competidores
novos ou ausentes e taxas de sobreposição quando reportadas.
Não inferir detalhes sobre preços dos concorrentes, orçamento ou estratégia
que não sejam conhecidos.

Fonte oficial: https://developers.google.com/google-ads/api/fields/v26/metrics

### Histórico de mudanças e período de observação

- Usar \`change_event\` (detalhes dos eventos recentes, janela de até 30 dias)
  e \`change_status\` quando apropriado.
- Registrar no próprio produto o diário das ações sugeridas pelo Kivai, aplicadas
  manualmente pelo gestor, e seu desempenho após o período combinado.
- Distinguir coincidência temporal de causalidade. Recomendação de "aguardar"
  é uma decisão útil, não uma ausência de diagnóstico.

Fonte: https://developers.google.com/google-ads/api/docs/change-event

### Interface das recomendações

Estados de prioridade sugeridos:
1. **Revisar agora**: orçamento ultrapassado, reprovação que impede veiculação,
   problemas críticos de mensuração, cobrança de custo acima do limite acordado.
2. **Investigar**: CPL/CPA/ROAS fora das metas com amostra suficiente,
   queda consistente, perda de cobertura ou demanda não explorada.
3. **Oportunidade**: consultas que geraram conversões, ativos promissores,
   realocação de verba com justificativa e margem para crescimento.
4. **Aguardar e monitorar**: mudanças muito recentes, aprendizagem em curso,
   dados insuficientes ou resultados dentro da faixa aceitável.
5. **Complementar dados**: conversões não segmentadas, plano não informado,
   relatório do leilão ou política não disponível, ausência de dados do CRM.

O gestor deve poder filtrar por cliente, conta, campanha, modalidade, período,
gravidade, status e objetivo da campanha, sempre com explicação rastreável.

### Estratégia de implementação barata

- **Reutilizar** Next.js, Supabase Auth, RLS, componentes UI, ferramenta de
  upload local, biblioteca de CSV, sistema de créditos e Gemini configurados
  no Kivai. Não instalar outra IA nem criar novo login.
- **Motor determinístico primeiro**: cálculos, comparações, política e regras
  auditáveis sem custo de IA por relatório. Gemini apenas nos diagnósticos
  que exigem linguagem natural, raciocínio semântico e variações de anúncio.
- Dados pessoais/confidenciais por arquivo: opção de análise local,
  limpeza de identificadores e consentimento antes de enviar qualquer conteúdo
  a serviço de IA. Nunca encaminhar nomes e contatos de leads sem necessidade.
- API Google Ads: leitura por MCC/conta autorizada, consultas por modalidade,
  cache e cotas, versionamento para schema, revalidação de token e acesso.
- Persistência: tabelas próprias de clientes, planos mensais, integrações,
  relatórios, snapshots, insights e diário de otimizações com RLS. A base existente
  de captação comercial \`trafego_leads\` não deve se misturar com a gestão privada.

### SEO e valor editorial

- Hub: Tráfego Pago. Ferramenta: Analisador de Tráfego Pago Google Ads.
- Página pública indexável **somente após revisão e entrega da funcionalidade
  principal prometida**; área privada de relatórios e clientes sempre noindex.
- Conteúdo original na página: objetivos, passo a passo com exemplos,
  tipos de campanha, métricas, limitações, critérios para alterar ou manter,
  segurança, FAQ e links internos para Calculadora ROAS, ROI e hub.
- Evitar afirmações como "faz tudo automaticamente", "integra todas as contas",
  "gera IA" ou "analisa o leilão por API" até que essas partes estejam prontas.
- Plano gratuito de entrada e créditos/recorrência dependem de custos e validação;
  não anunciar preço ainda não aprovado.

### Status da branch neste marco

**Implementado**: leitor local de campanhas e termos CSV, planejador matemático,
metas mensais com confirmação da definição de lead e valor atribuído,
motor determinístico de prioridades com evidências e recomendação de observar,
datas reais de período/idade da campanha/mudança, identificação preliminar de
termos com conversões, comparação de dois CSVs exportados de Informações do leilão
(domínios presentes e mudanças de participação) e guia SEO original.

**Ainda faltam**: recomendações oficiais conectadas via API, mapeamento de
ações de conversão, comparação de leilão com validação avançada de períodos,
públicos, anúncios, força do anúncio,
títulos/descrições com Gemini, recursos e palavras-chave recusados, análise de
concorrentes, CRM e plano persistido, MCC, alertas automatizados, notificações,
permissões granulares, testes end-to-end e publicação/indexação revisada.


## Beta Google Ads: proporção diária e 30 créditos de IA

### Regra de avaliação: último dia concluído

- A meta do mês deve ser comparada ao acumulado **até o último dia fechado** da conta, sem
  incluir o dia atual incompleto.
- Usar o fuso da conta Google Ads (campo customer.time_zone quando a API estiver ligada).
  Na importação manual, o usuário confirma as datas do arquivo; o Kivai pode sugerir o
  período do primeiro dia do mês até ontem em America/Sao_Paulo.
- Comparação linear: **meta acumulada = meta mensal × dias concluídos ÷ dias do mês**.
  Guardar precisão integral para cálculos, arredondar somente no texto/valor exibido.
- Ex.: 16/10/2026, exportação 01/10 a 15/10, outubro com 31 dias:
  meta 100 leads => 48,387096774... ≈ **48,39 leads**; realizado 50 => **+1,61 lead**,
  ou **+3,33%** sobre a meta acumulada.
  Orçamento mensal R$ 2.000 => gasto proporcional esperado R$ 967,7419... ≈ **R$ 967,74**.
  CPL contratado R$ 20 permanece **R$ 20**, não R$ 9,68.
- Aplicar a regra a **volumes e valores acumulados** (investimento, leads, compras,
  conversões qualificadas, receita atribuída), desde que o mesmo período e ação de
  conversão tenham sido confirmados.
- Não proporcionalizar **razões e taxas**: CPC, CPL, CPA, CTR, taxa de conversão ou ROAS.
- Uma variação em relação ao ritmo linear **não é prova** de desempenho ruim:
  a entrega é variável e há atrasos de conversões e sazonalidade.
- Quando o relatório é parcial ou não começa no dia 1, não confrontar com toda a meta
  mensal; sinalizar a necessidade de dados faltantes ou meta específica para o recorte.
- Não misturar métricas de clientes, moedas ou objetivos distintos.

Referências:
https://developers.google.com/google-ads/api/docs/conversions/reporting
https://developers.google.com/google-ads/api/fields/v26/customer
https://support.google.com/google-ads/answer/10486637?hl=pt-BR

### Beta de 30 créditos

- Concessão **uma vez por usuário Kivai com e-mail confirmado**.
- Cota **isolada** de 30 créditos para diagnósticos Gemini do Analisador Google Ads.
  A cota não altera saldos existentes Free, Pro, Agency, créditos comprados ou
  regras de crédito de outras ferramentas.
- **1 crédito = 1 diagnóstico com Gemini concluído e validado.**
- **Cálculo de métricas e importação local de relatórios são gratuitos.**
- Reserva por RPC transacional com idempotência, saldo protegido contra concorrência;
  falha de geração ou validação restitui a unidade.
- A cota não é mensal e não renova automaticamente. Proteções antiautomação:
  confirmação de e-mail, limite horário por usuário e limite global compartilhado de IA.
- Informar claramente quando as 30 análises tiverem acabado. Pacotes/planos pagos
  são uma evolução comercial futura, não consumir créditos comprados sem permissão.
- O saldo é visto apenas por usuário autenticado; não expor serviço ou chave no cliente.

Módulos da implementação:
- \`supabase/migrations/20261016220000_traffic_beta_credits.sql\`
- \`lib/ai/traffic-beta.ts\`
- \`app/api/ai/traffic-beta/route.ts\`
- \`app/api/ai/traffic-beta/analyze/route.ts\`
- \`components/tools/traffic-beta-assistant.tsx\`
- \`lib/ai/traffic-analysis.ts\`

**Ativação pública obrigatória**:
- Migrar o banco de dados via processo oficial sem sobrescrever tabelas existentes.
- Verificar novos RPCs de concessão/reserva/finalização e se o usuário deslogado
  e não confirmado não recebe bônus.
- Confirmar GEMINI_API_KEY no servidor, validação de JSON, controle de custo e
  retorno do crédito se o provedor falhar.
- Testar múltiplos usuários e 30 solicitações com reserva concorrente de idempotência.
- Testar os relatórios reais de todas as modalidades; cada diagnóstico descreve
  com precisão o que foi ou não lido.
- Só liberar indexação e sitemap da página depois de garantir que o beta prometido
  está funcional e o conteúdo foi revisado.
- Garantir noindex para saldos, análises privadas e dados dos clientes.
- Revisar proteção de abuso e quotas se a aquisição orgânica crescer.

### Estratégia híbrida API + relatório manual

A Google Ads API atende a vários recursos via GAQL e \`SearchStream\`,
incluindo campanhas, recomendações, dados de conversões, anúncios, recursos,
palavras-chave, segmentos, mudanças recentes e Performance Max com views próprias.
O acesso depende de OAuth e developer token com nível aprovado.
As métricas detalhadas de **Auction Insights** são marcadas como não
disponíveis publicamente. Campos personalizados da interface também não são
recuperáveis via API. Há dados omitidos por privacidade ou ausência de
amostras em relatórios de pesquisa.

Cada módulo do analisador deverá consultar capacidade do conector:
1. Dados suportados e acessíveis: buscar automaticamente em leitura.
2. Não disponíveis, incompletos ou sem autorização: oferecer importação
   manual do relatório ou planilha correspondente.
3. Relatório manual: preparar no navegador, mostrar tipo, período e limitações;
   enviar ao Gemini só após consentimento explícito.
4. Ao integrar IA, anexar os dados usados e sinais de confiança; nunca apresentar
   conteúdo importado como se viesse diretamente da API.

Importações beta existentes: CSV de campanhas, termos de pesquisa,
dois CSVs de Informações do leilão e até três arquivos complementares
CSV/TSV/XLSX (trechos textuais de até 12 mil caracteres cada).
Se o arquivo for maior, a ferramenta informa que o conteúdo está parcial.
Não há execução automática de alterações de campanha.

Fontes:
https://developers.google.com/google-ads/api/docs/reporting/overview
https://developers.google.com/google-ads/api/docs/productionize/access-levels
https://developers.google.com/google-ads/api/docs/conversions/reporting
https://developers.google.com/google-ads/api/fields/v26/metrics
