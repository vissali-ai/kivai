type HubEditorial = {
  eyebrow: string;
  title: string;
  introduction: string[];
  guides: Array<{ title: string; text: string }>;
  workflowTitle: string;
  workflow: string[];
  noteTitle: string;
  note: string;
};

const hubEditorial: Record<string, HubEditorial> = {
  imagens: {
    eyebrow: "Guia de imagens digitais",
    title: "Como escolher a operação certa para sua imagem",
    introduction: [
      "Editar uma imagem não significa sempre reduzir seu tamanho. Conversão altera o formato; compressão diminui o peso do arquivo; redimensionamento muda largura e altura; recorte remove partes da área visível. Identificar o objetivo antes de começar evita perda desnecessária de qualidade.",
      "Para sites e lojas virtuais, WebP costuma oferecer boa relação entre nitidez e tamanho. PNG é útil quando há transparência ou elementos gráficos, enquanto JPG é adequado para fotografias sem fundo transparente. Preserve sempre uma cópia do arquivo original.",
    ],
    guides: [
      { title: "Para publicar na web", text: "Redimensione para as dimensões reais de exibição e depois comprima. Arquivos maiores que o espaço ocupado na página consomem dados sem melhorar a visualização." },
      { title: "Para trocar o formato", text: "Use o conversor quando um sistema não aceitar o arquivo original. Verifique transparência, cores e qualidade antes de apagar a versão anterior." },
      { title: "Para ajustar a composição", text: "Recorte, gire ou espelhe antes de redimensionar. Assim, o enquadramento é definido com a maior quantidade possível de informação." },
    ],
    workflowTitle: "Fluxo recomendado para imagens de produto",
    workflow: ["Comece pela imagem original com a melhor resolução disponível.", "Ajuste enquadramento, orientação e fundo conforme a finalidade.", "Redimensione para o canal em que a imagem será publicada.", "Converta e comprima por último, comparando o resultado visual."],
    noteTitle: "Qualidade e privacidade",
    note: "Ferramentas que processam arquivos no navegador mantêm o trabalho no dispositivo durante a sessão. Mesmo assim, revise o resultado e evite fechar a página antes do download. Para materiais importantes, guarde o original em local seguro.",
  },
  pdfs: {
    eyebrow: "Guia de documentos PDF",
    title: "Escolha entre converter, editar ou reorganizar o PDF",
    introduction: [
      "PDF foi criado para preservar a apresentação de um documento. Por isso, transformar seu conteúdo em Word, Excel ou PowerPoint exige operações diferentes de simplesmente unir, girar ou redimensionar páginas.",
      "Antes de escolher uma ferramenta, confirme se o PDF contém texto selecionável ou apenas imagens digitalizadas. Conversores sem OCR trabalham com o texto já existente no arquivo e não reconhecem automaticamente documentos escaneados.",
    ],
    guides: [
      { title: "Converter conteúdo", text: "Use PDF para Word quando precisar editar texto, PDF para Excel para recuperar tabelas e PDF para PowerPoint quando cada página puder funcionar como um slide visual." },
      { title: "Preparar para impressão", text: "Redimensionar troca o formato de cada página. Montar para impressão cria novas folhas e permite posicionar ou repetir o conteúdo, como etiquetas e cartões." },
      { title: "Organizar páginas", text: "Unir, dividir e girar preservam o documento em PDF. São indicados quando o conteúdo está correto e apenas a sequência ou orientação precisa mudar." },
    ],
    workflowTitle: "Antes de processar um documento",
    workflow: ["Faça uma cópia do PDF original.", "Confira proteção por senha, tamanho e quantidade de páginas.", "Escolha a ferramenta de acordo com o resultado final desejado.", "Abra o arquivo baixado e revise textos, tabelas, fontes e paginação."],
    noteTitle: "Documentos sensíveis",
    note: "As ferramentas destacadas informam quando o processamento ocorre localmente. Ainda assim, avalie a confidencialidade do documento, use um dispositivo confiável e remova arquivos baixados de computadores compartilhados.",
  },
  calculadoras: {
    eyebrow: "Guia de indicadores",
    title: "Use cada cálculo para responder uma pergunta diferente",
    introduction: [
      "Porcentagem, margem, markup, ROI e ROAS não são nomes diferentes para o mesmo resultado. Cada indicador utiliza uma base específica e responde a uma decisão distinta de preço, investimento ou desempenho de campanha.",
      "Uma calculadora reduz erros aritméticos, mas não substitui a qualidade dos dados informados. Custos ignorados, receitas atribuídas incorretamente e períodos diferentes podem produzir um número matematicamente correto e uma conclusão de negócio equivocada.",
    ],
    guides: [
      { title: "Preço e rentabilidade", text: "Markup ajuda a formar o preço a partir do custo. Margem mostra quanto da receita permanece após o custo considerado. Os percentuais não devem ser tratados como equivalentes." },
      { title: "Campanhas", text: "ROAS compara receita atribuída à publicidade com o investimento em mídia. Ele não inclui automaticamente impostos, produto, equipe, plataforma ou logística." },
      { title: "Investimento completo", text: "ROI relaciona ganho ou perda ao investimento total definido. Compare sempre resultados calculados para o mesmo intervalo de tempo e com critérios consistentes." },
    ],
    workflowTitle: "Como interpretar um resultado",
    workflow: ["Defina exatamente quais valores entram no cálculo.", "Use números do mesmo período e da mesma operação.", "Confira a fórmula e a unidade apresentada.", "Analise o indicador junto com custos, riscos e capacidade operacional."],
    noteTitle: "Resultados são estimativas",
    note: "As calculadoras têm finalidade informativa e educacional. Decisões financeiras, fiscais ou contábeis devem considerar dados completos e, quando necessário, orientação profissional qualificada.",
  },
  texto: {
    eyebrow: "Guia de análise textual",
    title: "Contagem ajuda a revisar; contexto define a qualidade",
    introduction: [
      "Métricas de texto são úteis para respeitar limites, estimar tempo de leitura e identificar repetições, mas não medem clareza, precisão ou utilidade. Um texto curto pode estar completo; um texto longo pode repetir ideias sem acrescentar informação.",
      "A contagem também varia conforme a regra utilizada. Espaços, emojis, pontuação, quebras de linha e caracteres combinados podem ser interpretados de maneiras diferentes por editores e plataformas.",
    ],
    guides: [
      { title: "Palavras e caracteres", text: "Use palavras para estimar extensão e leitura. Use caracteres quando o canal impuser um limite técnico, observando se ele considera ou não espaços." },
      { title: "Tempo de leitura", text: "A estimativa parte de uma velocidade média. Termos técnicos, listas, tabelas e o nível de familiaridade do leitor podem alterar bastante o tempo real." },
      { title: "Revisão final", text: "Depois de ajustar o tamanho, revise coerência, fontes, ortografia e chamadas para ação. Não remova informações essenciais apenas para atingir um número." },
    ],
    workflowTitle: "Uma revisão textual prática",
    workflow: ["Escreva a primeira versão pensando na mensagem.", "Meça palavras, caracteres e tempo estimado.", "Corte redundâncias e esclareça trechos ambíguos.", "Leia novamente no contexto em que o texto será publicado."],
    noteTitle: "Dados digitados",
    note: "Para textos confidenciais, prefira ferramentas que façam a análise localmente e evite colar senhas, dados bancários, documentos pessoais ou informações que não sejam necessárias para a tarefa.",
  },
  "social-media": {
    eyebrow: "Guia para publicações sociais",
    title: "Prepare a legenda para a plataforma e para quem vai ler",
    introduction: [
      "Formatação, quantidade de hashtags e limite de caracteres afetam a publicação, mas não garantem alcance. O conteúdo precisa continuar compreensível fora das métricas e respeitar o contexto, o público e as regras atuais da plataforma escolhida.",
      "Limites de redes sociais podem mudar. Use os contadores como apoio durante a edição e confira as informações exibidas pelo próprio aplicativo antes de publicar campanhas importantes.",
    ],
    guides: [
      { title: "Legenda", text: "Apresente a informação principal cedo, divida blocos longos e mantenha chamadas para ação coerentes com o conteúdo. Quebras de linha devem melhorar a leitura, não esconder informação." },
      { title: "Hashtags", text: "Prefira termos realmente relacionados à publicação. Repetir listas genéricas em todo conteúdo pode reduzir relevância e dificultar a leitura." },
      { title: "Acessibilidade", text: "Use linguagem clara, descreva elementos visuais importantes e evite sequências excessivas de emojis ou caracteres decorativos que prejudiquem leitores de tela." },
    ],
    workflowTitle: "Antes de publicar",
    workflow: ["Escreva a mensagem completa e identifique o objetivo.", "Organize parágrafos, chamada para ação e hashtags.", "Confira caracteres e visualização em tela pequena.", "Faça uma revisão humana de tom, links e informações factuais."],
    noteTitle: "Sem promessa de desempenho",
    note: "As ferramentas auxiliam na preparação técnica do texto. Alcance, engajamento e distribuição dependem de fatores externos e não podem ser garantidos por contagem de caracteres, formatação ou hashtags.",
  },
  videos: {
    eyebrow: "Guia de processamento de vídeo",
    title: "Planeje a edição conforme formato, duração e dispositivo",
    introduction: [
      "Vídeos exigem mais memória e processamento que imagens. A compatibilidade depende do navegador, dos codecs presentes no arquivo e dos recursos disponíveis no celular ou computador.",
      "Recortar altera a área visível; redimensionar muda as dimensões; dividir separa trechos; ajustar velocidade muda a duração; remover áudio elimina a faixa sonora. Definir a operação correta reduz conversões desnecessárias.",
    ],
    guides: [
      { title: "Compatibilidade", text: "Arquivos com a mesma extensão podem utilizar codecs diferentes. Se o navegador não conseguir decodificar o vídeo, converter o arquivo em um aplicativo compatível pode ser necessário." },
      { title: "Qualidade e tamanho", text: "Resolução, taxa de quadros, duração e compressão influenciam o resultado. Ampliar um vídeo pequeno não cria detalhes que não existem no original." },
      { title: "Desempenho", text: "Feche abas pesadas, mantenha espaço livre e processe arquivos longos em um computador quando possível. Não atualize a página enquanto a exportação estiver em andamento." },
    ],
    workflowTitle: "Ordem eficiente de edição",
    workflow: ["Guarde o vídeo original antes de qualquer alteração.", "Recorte duração e enquadramento primeiro.", "Ajuste orientação, dimensões, velocidade e áudio.", "Exporte, assista ao arquivo inteiro e confira sincronização e qualidade."],
    noteTitle: "Processamento local",
    note: "Quando executado no navegador, o processamento evita o envio do vídeo ao Kivai, mas utiliza recursos do dispositivo. Arquivos grandes podem falhar por limite de memória; mantenha o original e confirme o download antes de sair.",
  },
  arquivos: {
    eyebrow: "Guia de arquivos compactados",
    title: "Entenda quando compactar e quando descompactar arquivos",
    introduction: [
      "Compactar arquivos serve para reunir um ou mais itens em um único pacote e, dependendo do conteúdo, reduzir o tamanho total. Descompactar faz o caminho inverso: abre um pacote como ZIP ou RAR para recuperar os arquivos originais.",
      "ZIP e RAR têm finalidades semelhantes, mas são formatos diferentes. Por isso, a compatibilidade depende do tipo de arquivo e da operação escolhida. Antes de processar documentos importantes, mantenha sempre uma cópia do original.",
    ],
    guides: [
      { title: "Descompactar ZIP", text: "Indicado para abrir pacotes ZIP e recuperar os arquivos contidos neles." },
      { title: "Descompactar RAR", text: "Indicado para abrir arquivos RAR e extrair o conteúdo para uso normal." },
      { title: "Compactar em ZIP", text: "Útil para reunir vários arquivos em um único pacote ZIP para organizar, armazenar ou compartilhar." },
    ],
    workflowTitle: "Boas práticas antes de começar",
    workflow: ["Guarde uma cópia do arquivo original.", "Confira o formato e o tamanho antes de processar.", "Evite fechar ou atualizar a página durante a operação.", "Abra o resultado e confirme se todos os arquivos estão presentes."],
    noteTitle: "Privacidade e processamento",
    note: "As ferramentas deste hub serão desenvolvidas com prioridade para processamento local no navegador sempre que tecnicamente possível. Isso reduz dependência de servidores e evita o envio desnecessário dos arquivos ao Kivai.",
  },
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function getExistingHubEditorialHtml(slug: string) {
  const content = hubEditorial[slug];
  if (!content) return "";
  return [
    `<p>${escapeHtml(content.eyebrow)}</p>`,
    `<h2>${escapeHtml(content.title)}</h2>`,
    ...content.introduction.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ...content.guides.flatMap((guide) => [`<h3>${escapeHtml(guide.title)}</h3>`, `<p>${escapeHtml(guide.text)}</p>`]),
    `<h3>${escapeHtml(content.workflowTitle)}</h3>`,
    `<ol>${content.workflow.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`,
    `<h3>${escapeHtml(content.noteTitle)}</h3>`,
    `<p>${escapeHtml(content.note)}</p>`,
  ].join("");
}
