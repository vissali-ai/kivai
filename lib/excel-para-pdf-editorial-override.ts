export const excelParaPdfEditorialOverride = {
  overview: [
    "Excel para PDF transforma o conteúdo das células de planilhas XLSX em páginas de PDF configuráveis. A ferramenta permite escolher e reorganizar abas, ajustar orientação, papel, margens, escala, linhas de grade, cabeçalhos de linha e coluna e repetição da primeira linha antes da geração.",
    "A versão atual reconstrói visualmente as células no navegador e depois rasteriza cada página para inserir no PDF. Por isso, o resultado é adequado para leitura, compartilhamento e impressão, mas não equivale à exportação nativa do Microsoft Excel e o texto do PDF não permanece como texto vetorial selecionável.",
  ],
  useCases: [
    { title: "Relatórios", description: "Crie uma versão fixa de tabelas e demonstrativos para distribuição ou arquivamento." },
    { title: "Impressão", description: "Escolha papel, orientação, margens e ajuste de página para reduzir cortes de linhas e colunas." },
    { title: "Seleção de abas", description: "Converta somente as abas necessárias, inclusive ocultas quando você optar por incluí-las, e defina a ordem final." },
    { title: "Revisão antes do download", description: "Prepare as páginas e confira a prévia antes de gerar o PDF definitivo." },
  ],
  steps: [
    "Selecione um arquivo XLSX de até 25 MB.",
    "Escolha, exclua ou reorganize as abas que deseja converter.",
    "Defina orientação, papel, margens, ajuste, linhas de grade e demais opções de apresentação.",
    "Prepare a prévia, revise as páginas e gere o PDF para download.",
  ],
  specifications: [
    { label: "Entrada", value: "Arquivo XLSX de até 25 MB. O formato XLS antigo não é aceito." },
    { label: "Limites", value: "Até 20 abas, 50.000 células consideradas e no máximo 100 páginas no resultado." },
    { label: "Papel", value: "A4, Carta e Ofício, em orientação automática, retrato ou paisagem." },
    { label: "Saída", value: "PDF rasterizado a partir da representação visual das células preparada no navegador." },
  ],
  privacy: "A leitura do XLSX, a preparação das páginas e a geração do PDF acontecem localmente no navegador. A planilha não precisa ser enviada ao Kivai para esta conversão.",
  limitations: [
    "A versão atual renderiza o conteúdo das células, mas não incorpora gráficos, imagens, desenhos ou outros objetos avançados existentes no arquivo XLSX.",
    "Fórmulas não são recalculadas. A ferramenta usa o resultado armazenado no arquivo; fórmulas sem resultado salvo podem aparecer em branco.",
    "O PDF final é criado a partir de imagens rasterizadas das páginas; o texto não permanece como texto vetorial selecionável e a ampliação extrema pode revelar perda de nitidez.",
    "Alguns estilos avançados, fontes, cores de tema, formatações condicionais e recursos específicos do Excel podem ser simplificados ou não aparecer como no aplicativo original.",
    "Planilhas extensas podem atingir os limites de abas, células, páginas ou memória definidos para estabilidade do navegador.",
  ],
  faqs: [
    { question: "Posso escolher quais abas converter?", answer: "Sim. Você pode selecionar, excluir, restaurar e reorganizar as abas. Também pode optar por incluir abas ocultas." },
    { question: "As fórmulas serão recalculadas?", answer: "Não. A ferramenta utiliza os resultados que já estavam armazenados no XLSX. Fórmulas sem resultado salvo podem ficar em branco." },
    { question: "Gráficos e imagens aparecem no PDF?", answer: "Não nesta versão. O motor atual reconstrói as células da planilha, mas não incorpora gráficos, imagens, desenhos ou outros objetos avançados." },
    { question: "O texto do PDF fica selecionável?", answer: "Não necessariamente. As páginas são rasterizadas antes de serem inseridas no PDF, portanto o resultado é principalmente visual." },
    { question: "A planilha é enviada ao servidor?", answer: "Não. A conversão desta ferramenta acontece localmente no navegador." },
  ],
  related: [
    { href: "/ferramentas/pdf-para-excel", label: "PDF para Excel" },
    { href: "/ferramentas/word-para-pdf", label: "Word para PDF" },
    { href: "/ferramentas/pdf-para-powerpoint", label: "PDF para PowerPoint" },
    { href: "/ferramentas/powerpoint-para-pdf", label: "PowerPoint para PDF" },
    { href: "/ferramentas/imagens-para-pdf", label: "Imagens para PDF" },
    { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
  ],
} as const;
