export type GeneralToolEditorialSlug =
  | "calculadora-de-roas"
  | "calculadora-de-roi"
  | "calculadora-de-markup"
  | "calculadora-de-margem"
  | "calculadora-de-desconto"
  | "calculadora-de-porcentagem"
  | "contador-de-palavras"
  | "contador-de-caracteres-instagram"
  | "quebra-de-linha-instagram";

type EditorialContent = {
  categoryName: string;
  categoryHref: string;
  applicationCategory: string;
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

const calculatorRelated = [
  { href: "/ferramentas/calculadora-de-roas", label: "Calculadora de ROAS" },
  { href: "/ferramentas/calculadora-de-roi", label: "Calculadora de ROI" },
  { href: "/ferramentas/calculadora-de-markup", label: "Calculadora de Markup" },
  { href: "/ferramentas/calculadora-de-margem", label: "Calculadora de Margem" },
  { href: "/ferramentas/calculadora-de-desconto", label: "Calculadora de Desconto" },
  { href: "/ferramentas/calculadora-de-porcentagem", label: "Calculadora de Porcentagem" },
];

function calculator(input: Omit<EditorialContent, "categoryName" | "categoryHref" | "applicationCategory" | "privacy" | "related">): EditorialContent {
  return {
    categoryName: "Calculadoras",
    categoryHref: "/ferramentas/calculadoras",
    applicationCategory: "FinanceApplication",
    privacy: "Os valores são calculados localmente no navegador e não são enviados ao Kivai. Limpar a página ou fechar a aba remove os dados preenchidos nesta sessão.",
    related: calculatorRelated,
    ...input,
  };
}

const instagramRelated = [
  { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de caracteres" },
  { href: "/ferramentas/quebra-de-linha-instagram", label: "Quebra de linha" },
  { href: "/ferramentas/contador-de-palavras", label: "Contador de palavras" },
];

export const generalToolEditorialContent: Record<GeneralToolEditorialSlug, EditorialContent> = {
  "calculadora-de-roas": calculator({
    overview: [
      "ROAS é a relação entre a receita atribuída aos anúncios e o valor investido em mídia. Um resultado de 4x significa que, para cada R$ 1 aplicado em anúncios, foram atribuídos R$ 4 em receita.",
      "A ferramenta também permite informar a margem disponível antes da mídia para estimar o ROAS de equilíbrio. Essa comparação evita interpretar faturamento como lucro e ajuda a avaliar campanhas com o contexto econômico da operação.",
    ],
    useCases: [
      { title: "Avaliar campanhas", description: "Compare receita atribuída e investimento dentro do mesmo período e modelo de atribuição." },
      { title: "Planejar o ponto de equilíbrio", description: "Use a margem de contribuição para estimar o retorno mínimo necessário antes de ampliar o orçamento." },
      { title: "Comparar canais", description: "Calcule cada canal separadamente, mantendo iguais a janela de análise e a regra de atribuição." },
    ],
    steps: ["Informe o investimento total em anúncios.", "Digite a receita atribuída à campanha.", "Se souber, adicione a margem disponível antes da mídia.", "Analise o ROAS atual e, quando disponível, o ROAS de equilíbrio."],
    specifications: [
      { label: "Fórmula principal", value: "ROAS = receita atribuída ÷ investimento em anúncios." },
      { label: "Exemplo", value: "R$ 8.000 de receita ÷ R$ 2.000 de mídia = ROAS de 4x." },
      { label: "ROAS de equilíbrio", value: "Estimativa calculada por 1 ÷ margem decimal. Uma margem de 25% corresponde a aproximadamente 4x." },
      { label: "Resultado", value: "Retorno em múltiplos, acompanhado de uma leitura contextual e comparação com o equilíbrio." },
    ],
    limitations: ["ROAS não inclui automaticamente produto, impostos, taxas, equipe, frete ou custos fixos.", "A receita precisa seguir uma regra de atribuição consistente; plataformas diferentes podem atribuir a mesma venda.", "O resultado histórico não garante desempenho futuro nem substitui a análise financeira completa."],
    faqs: [
      { question: "ROAS alto significa lucro?", answer: "Não necessariamente. A campanha só é lucrativa quando o retorno também cobre produto, impostos, taxas, operação e demais custos." },
      { question: "Qual é um bom ROAS?", answer: "Não existe valor universal. O mínimo depende principalmente da margem de contribuição e dos custos que não estão incluídos na mídia." },
      { question: "ROAS e ROI são iguais?", answer: "Não. ROAS relaciona receita e gasto publicitário; ROI mede ganho ou perda em relação ao investimento total considerado." },
      { question: "Posso comparar campanhas de períodos diferentes?", answer: "Pode, desde que sazonalidade, janela de atribuição e estágio das campanhas sejam considerados na interpretação." },
    ],
  }),
  "calculadora-de-roi": calculator({
    overview: ["ROI mede o ganho ou a perda de um investimento em relação ao valor investido. A ferramenta subtrai o investimento do retorno e divide essa diferença pelo investimento.", "Um ROI positivo indica retorno superior ao investimento informado; zero indica equivalência e um valor negativo indica perda. A qualidade da análise depende de incluir receitas e custos do mesmo período e escopo."],
    useCases: [{ title: "Projetos e campanhas", description: "Compare o retorno obtido com todos os gastos diretamente atribuídos à iniciativa." }, { title: "Compra de equipamentos", description: "Estime o desempenho financeiro usando economia ou receita incremental como retorno." }, { title: "Comparação de alternativas", description: "Aplique o mesmo horizonte de tempo e os mesmos critérios de custo em cada opção." }],
    steps: ["Informe o investimento total do período.", "Digite o retorno financeiro obtido no mesmo escopo.", "Confira o ganho ou a perda em reais.", "Interprete o ROI percentual junto do prazo e do risco."],
    specifications: [{ label: "Fórmula", value: "ROI = (retorno − investimento) ÷ investimento × 100." }, { label: "Exemplo", value: "R$ 15.000 de retorno e R$ 10.000 investidos resultam em ganho de R$ 5.000 e ROI de 50%." }, { label: "Entradas", value: "Investimento maior que zero e retorno igual ou maior que zero." }, { label: "Resultado", value: "ROI percentual, ganho ou perda monetária e análise do sinal do resultado." }],
    limitations: ["O cálculo simples não ajusta inflação, impostos, custo de capital ou valor do dinheiro no tempo.", "Benefícios não financeiros precisam de metodologia própria antes de serem convertidos em valor.", "Comparar ROIs de prazos ou riscos muito diferentes pode levar a conclusões incompletas."],
    faqs: [{ question: "ROI pode ser negativo?", answer: "Sim. Isso ocorre quando o retorno é menor que o investimento dentro do período analisado." }, { question: "ROI de 100% significa o quê?", answer: "Significa que o ganho líquido foi igual ao valor investido; o retorno bruto correspondeu ao dobro do investimento." }, { question: "Devo usar receita ou lucro como retorno?", answer: "Use uma base coerente com os custos incluídos. Para uma visão econômica mais fiel, evite comparar receita bruta com investimento parcial." }, { question: "ROI considera o tempo?", answer: "Esta versão não anualiza o resultado. Registre o período ao comparar investimentos." }],
  }),
  "calculadora-de-markup": calculator({
    overview: ["Markup é um acréscimo aplicado ao custo para formar um preço de venda. Nesta ferramenta, o percentual informado incide diretamente sobre o custo total.", "Markup e margem não são sinônimos: um markup de 50% sobre R$ 100 gera preço de R$ 150 e margem bruta de 33,33%, porque a margem é calculada sobre o preço de venda."],
    useCases: [{ title: "Precificação inicial", description: "Simule um preço a partir do custo total unitário e do acréscimo desejado." }, { title: "Revisão de catálogo", description: "Observe como alterações de custo afetam preço, lucro bruto e margem resultante." }, { title: "Negociação", description: "Teste percentuais antes de definir tabelas comerciais ou condições de revenda." }],
    steps: ["Some os custos aplicáveis a uma unidade.", "Informe o custo total no primeiro campo.", "Digite o percentual de markup desejado.", "Confira preço sugerido, lucro bruto e margem resultante."],
    specifications: [{ label: "Fórmula do preço", value: "Preço = custo × (1 + markup ÷ 100)." }, { label: "Lucro bruto", value: "Preço sugerido menos o custo total informado." }, { label: "Margem resultante", value: "Lucro bruto ÷ preço sugerido × 100." }, { label: "Método utilizado", value: "Markup sobre custo; não é o método de divisor usado em algumas planilhas de precificação." }],
    limitations: ["Custos omitidos produzem um preço sugerido artificialmente baixo.", "O cálculo não determina demanda, preço do concorrente ou percepção de valor.", "Impostos e comissões devem entrar no custo ou ser avaliados separadamente conforme o negócio."],
    faqs: [{ question: "Markup de 100% dobra o custo?", answer: "Sim. Neste método, R$ 100 com markup de 100% gera preço sugerido de R$ 200." }, { question: "Markup de 50% é margem de 50%?", answer: "Não. Nesse caso, a margem sobre o preço é aproximadamente 33,33%." }, { question: "Qual custo devo informar?", answer: "Use o custo total unitário relevante, incluindo os componentes que deseja recuperar no preço." }, { question: "O preço calculado garante lucro?", answer: "Não. O resultado depende de vendas, custos efetivos, tributos, descontos e outras despesas." }],
  }),
  "calculadora-de-margem": calculator({
    overview: ["A margem mostra quanto do preço de venda resta depois de subtrair o custo total informado. Ela é expressa como percentual do preço, não do custo.", "Além do percentual, a ferramenta apresenta o lucro ou prejuízo por venda. Isso facilita identificar preços abaixo do custo e comparar cenários usando uma base comum."],
    useCases: [{ title: "Analisar produtos", description: "Calcule a margem unitária a partir do preço praticado e do custo total." }, { title: "Revisar descontos", description: "Simule o novo preço para verificar quanto da margem permanece após uma promoção." }, { title: "Detectar prejuízo", description: "Identifique rapidamente quando o custo supera o valor de venda." }],
    steps: ["Informe o preço de venda unitário.", "Digite o custo total referente à mesma unidade.", "Confira o resultado monetário por venda.", "Analise a margem percentual e revise custos omitidos."],
    specifications: [{ label: "Fórmula", value: "Margem = (preço − custo) ÷ preço × 100." }, { label: "Exemplo", value: "Preço de R$ 150 e custo de R$ 100 resultam em R$ 50 e margem de 33,33%." }, { label: "Margem negativa", value: "Ocorre quando o custo total é superior ao preço de venda." }, { label: "Base percentual", value: "O denominador é o preço de venda, diferentemente do markup sobre custo." }],
    limitations: ["A margem calculada reflete apenas os custos informados.", "Margem bruta não equivale automaticamente a lucro líquido da empresa.", "Custos variáveis, devoluções, impostos e despesas fixas podem alterar o resultado real."],
    faqs: [{ question: "Margem e markup são iguais?", answer: "Não. Margem usa o preço como base; markup normalmente representa um acréscimo sobre o custo." }, { question: "É possível ter margem negativa?", answer: "Sim, quando o custo informado é maior que o preço de venda." }, { question: "Margem de 30% significa lucro líquido de 30%?", answer: "Não necessariamente. Outras despesas podem não estar incluídas no custo informado." }, { question: "Como aumentar a margem?", answer: "Em termos matemáticos, aumentando o preço ou reduzindo o custo; a decisão comercial exige avaliar demanda e concorrência." }],
  }),
  "calculadora-de-desconto": calculator({
    overview: ["A calculadora aplica um percentual de desconto ao preço original e apresenta tanto a economia quanto o preço final.", "Ela é útil para conferir promoções e planejar ofertas, desde que o preço original seja uma referência legítima e o percentual esteja entre 0% e 100%."],
    useCases: [{ title: "Conferir promoções", description: "Descubra o valor efetivamente economizado e compare preços finais." }, { title: "Planejar campanhas", description: "Simule percentuais antes de publicar uma oferta." }, { title: "Negociar compras", description: "Calcule rapidamente o impacto de uma redução sobre o valor de referência." }],
    steps: ["Informe o preço original.", "Digite o percentual de desconto.", "Confira o valor economizado.", "Use o preço final, e não apenas o percentual, para comparar ofertas."],
    specifications: [{ label: "Valor do desconto", value: "Preço original × percentual ÷ 100." }, { label: "Preço final", value: "Preço original − valor do desconto." }, { label: "Faixa aceita", value: "Percentuais de 0% a 100%." }, { label: "Exemplo", value: "20% sobre R$ 250 economiza R$ 50 e resulta em preço final de R$ 200." }],
    limitations: ["A ferramenta não verifica se o preço original foi praticado anteriormente.", "Frete, juros, cupons cumulativos e taxas não entram automaticamente.", "Descontos sucessivos não devem ser simplesmente somados; aplique cada um sobre o valor atualizado."],
    faqs: [{ question: "Como calcular 20% de desconto?", answer: "Multiplique o preço por 0,20 e subtraia o resultado do preço original." }, { question: "Dois descontos de 10% equivalem a 20%?", answer: "Não. Aplicados sucessivamente, equivalem a 19% sobre o preço inicial." }, { question: "Desconto de 100% resulta em quê?", answer: "O preço final calculado é zero." }, { question: "A calculadora inclui parcelamento?", answer: "Não. Ela calcula somente a redução percentual sobre o preço informado." }],
  }),
  "calculadora-de-porcentagem": calculator({
    overview: ["Porcentagem representa uma razão com base em 100. A ferramenta reúne cálculos para encontrar uma parte percentual, descobrir qual percentual um valor representa e medir aumentos ou reduções.", "Cada modo apresenta a fórmula e as etapas usadas no resultado, ajudando a distinguir variação percentual de diferença em pontos percentuais."],
    useCases: [{ title: "Finanças pessoais", description: "Calcule reajustes, descontos, taxas e participações." }, { title: "Análise de resultados", description: "Meça a variação entre um valor inicial e um valor final." }, { title: "Estudos e conferência", description: "Veja a fórmula aplicada e confira cálculos manuais." }],
    steps: ["Escolha o tipo de cálculo.", "Leia os rótulos e informe os dois valores.", "Clique em calcular.", "Confira o resultado, a fórmula e as etapas exibidas."],
    specifications: [{ label: "Parte de um total", value: "Percentual ÷ 100 × valor." }, { label: "Percentual entre valores", value: "Parte ÷ total × 100." }, { label: "Variação percentual", value: "(valor final − inicial) ÷ valor inicial × 100." }, { label: "Entradas", value: "Aceita ponto ou vírgula como separador decimal nos modos disponíveis." }],
    limitations: ["Variação percentual não é definida quando o valor inicial é zero.", "Pontos percentuais e variação percentual são medidas diferentes.", "Arredondamentos podem causar pequenas diferenças em cálculos encadeados."],
    faqs: [{ question: "Como calcular 10% de um valor?", answer: "Divida o valor por 10; isso equivale a multiplicá-lo por 0,10." }, { question: "Qual a diferença entre porcentagem e ponto percentual?", answer: "Passar de 20% para 25% é aumento de 5 pontos percentuais e variação relativa de 25%." }, { question: "Posso usar números decimais?", answer: "Sim, usando vírgula ou ponto como separador." }, { question: "Como desfazer um desconto?", answer: "Divida o preço final por 1 menos o desconto em formato decimal; não basta somar o mesmo percentual." }],
  }),
  "contador-de-palavras": {
    categoryName: "Ferramentas de texto", categoryHref: "/ferramentas/texto", applicationCategory: "UtilitiesApplication",
    overview: ["O contador analisa o texto enquanto você digita e apresenta palavras, caracteres, frases, parágrafos e estimativas de leitura. A contagem ajuda a cumprir limites editoriais sem alterar o conteúdo.", "As estimativas de tempo usam uma velocidade média e servem como referência. Idioma, pontuação, números, abreviações e ritmo do leitor podem modificar o tempo real."],
    useCases: [{ title: "Produção editorial", description: "Confira extensão de artigos, descrições, trabalhos e roteiros." }, { title: "Limites de formulário", description: "Compare caracteres com o máximo solicitado por uma plataforma." }, { title: "Planejamento de leitura", description: "Estime a duração aproximada de textos e apresentações." }],
    steps: ["Digite ou cole o texto na área de análise.", "Acompanhe as métricas atualizadas em tempo real.", "Revise espaços, parágrafos e pontuação quando necessário.", "Copie ou ajuste o texto conforme o limite do destino."],
    specifications: [{ label: "Palavras", value: "Sequências de conteúdo separadas por espaços em branco." }, { label: "Caracteres", value: "Contagem com e sem espaços, conforme os indicadores da ferramenta." }, { label: "Estrutura", value: "Métricas de frases e parágrafos baseadas na organização do texto." }, { label: "Tempo estimado", value: "Projeção por velocidade média de leitura, não uma medição individual." }],
    privacy: "A análise acontece localmente no navegador. O texto não é enviado ao Kivai; ainda assim, evite colar senhas, dados bancários ou informações pessoais desnecessárias.",
    limitations: ["Hífens, URLs, emojis e abreviações podem ser tratados de modo diferente por outros editores.", "A estimativa de leitura varia conforme complexidade, idioma e leitor.", "A ferramenta mede estrutura e extensão, não qualidade, autoria ou correção gramatical."],
    faqs: [{ question: "Espaços contam como caracteres?", answer: "A ferramenta diferencia métricas com e sem espaços quando ambas são apresentadas." }, { question: "A contagem funciona para textos em português?", answer: "Sim. Ela também aceita outros idiomas, embora regras linguísticas específicas possam alterar frases e palavras compostas." }, { question: "Meu texto é armazenado?", answer: "Não pelo contador. O processamento ocorre na página durante a sessão." }, { question: "O tempo de leitura é exato?", answer: "Não. É uma estimativa baseada em velocidade média." }],
    related: [{ href: "/ferramentas/contador-de-caracteres-instagram", label: "Caracteres para Instagram" }, { href: "/ferramentas/quebra-de-linha-instagram", label: "Quebra de linha para Instagram" }],
  },
  "contador-de-caracteres-instagram": {
    categoryName: "Social Media", categoryHref: "/ferramentas/social-media", applicationCategory: "BusinessApplication",
    overview: ["Esta ferramenta conta os caracteres, palavras e hashtags de uma legenda antes da publicação. A análise em tempo real facilita revisar tamanho e estrutura sem enviar o texto a um servidor.", "Os limites e a forma como o Instagram exibe textos podem mudar. Use a contagem como conferência editorial e valide a prévia no aplicativo antes de publicar."],
    useCases: [{ title: "Legendas", description: "Acompanhe a extensão durante a redação." }, { title: "Chamadas e biografias", description: "Compare versões curtas e objetivas antes de levar o texto ao aplicativo." }, { title: "Revisão de campanhas", description: "Padronize a conferência de textos preparados por uma equipe." }],
    steps: ["Cole ou digite o texto.", "Observe caracteres, palavras e hashtags.", "Edite a legenda até atingir a extensão desejada.", "Copie o texto e confira a prévia no Instagram."],
    specifications: [{ label: "Caracteres", value: "Inclui letras, números, pontuação, espaços e quebras presentes no campo." }, { label: "Palavras", value: "Estimativa por separação em espaços em branco." }, { label: "Hashtags", value: "Termos iniciados por # identificados no texto." }, { label: "Resultado", value: "Atualização local e imediata, sem promessa de alcance ou aprovação pela plataforma." }],
    privacy: "O texto permanece no navegador durante o uso e não é enviado ao Kivai. Evite incluir credenciais ou dados pessoais desnecessários em rascunhos.",
    limitations: ["A ferramenta não publica nem acessa sua conta do Instagram.", "Limites e regras da plataforma podem mudar sem aviso.", "Caracteres visuais podem ocupar mais de uma unidade técnica em alguns sistemas."],
    faqs: [{ question: "Espaços entram na contagem?", answer: "Sim. Espaços e quebras de linha são caracteres do texto." }, { question: "A ferramenta garante que a legenda será aceita?", answer: "Não. A validação final depende das regras atuais do Instagram." }, { question: "O texto é enviado ao Instagram?", answer: "Não. Você precisa copiá-lo e publicar manualmente." }, { question: "Hashtags também contam como caracteres?", answer: "Sim. O símbolo # e as letras da hashtag fazem parte da contagem total." }], related: instagramRelated,
  },
  "quebra-de-linha-instagram": {
    categoryName: "Social Media", categoryHref: "/ferramentas/social-media", applicationCategory: "BusinessApplication",
    overview: ["A ferramenta prepara separações visuais entre parágrafos inserindo um caractere invisível nas linhas vazias. Isso ajuda a preservar blocos quando uma plataforma remove linhas completamente vazias.", "O resultado é uma versão formatada para copiar. Como o comportamento de aplicativos muda entre versões e dispositivos, sempre confira a prévia antes da publicação definitiva."],
    useCases: [{ title: "Legendas longas", description: "Separe introdução, desenvolvimento e chamada para ação." }, { title: "Listas e avisos", description: "Crie respiro visual entre blocos de informação." }, { title: "Padronização", description: "Prepare rascunhos com uma estrutura consistente para copiar." }],
    steps: ["Digite a legenda usando quebras normais.", "Confira a prévia formatada.", "Copie o resultado gerado.", "Cole no Instagram e valide a aparência antes de publicar."],
    specifications: [{ label: "Método", value: "Insere um caractere invisível entre quebras para preservar linhas visualmente vazias." }, { label: "Entrada", value: "Texto simples com parágrafos definidos pelo usuário." }, { label: "Saída", value: "Texto pronto para copiar, mantendo o conteúdo original e acrescentando separadores." }, { label: "Compatibilidade", value: "Pode variar conforme aplicativo, sistema, fonte e futuras atualizações da plataforma." }],
    privacy: "A formatação acontece no navegador. O texto não é enviado ao Kivai nem publicado automaticamente.",
    limitations: ["O caractere invisível pode ser removido por outros editores ou aplicativos.", "A aparência final depende da versão do Instagram e do dispositivo.", "A ferramenta não corrige ortografia nem verifica limites da plataforma."],
    faqs: [{ question: "A ferramenta publica a legenda?", answer: "Não. Ela prepara o texto para você copiar e colar manualmente." }, { question: "Por que existe um caractere invisível?", answer: "Ele ocupa a linha que seria completamente vazia e pode ajudar a preservar o espaçamento." }, { question: "A formatação sempre funciona?", answer: "Não é possível garantir, pois aplicativos podem alterar o tratamento de espaços e quebras." }, { question: "O conteúdo da legenda é alterado?", answer: "As palavras permanecem iguais; são acrescentados apenas separadores nas quebras." }], related: instagramRelated,
  },
};
