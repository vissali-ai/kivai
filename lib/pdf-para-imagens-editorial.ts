export const pdfParaImagensEditorial = {
  overview: [
    "PDF para Imagens renderiza cada página do documento e cria uma imagem independente em PNG ou JPG. Textos, fotografias, gráficos e demais elementos visuais passam a fazer parte de uma imagem rasterizada, portanto o conteúdo deixa de ser selecionável como texto no arquivo gerado.",
    "A renderização usa escala 2. PNG é gerado sem compressão com perdas; JPG é criado com qualidade 0,95 e pode produzir arquivos menores em páginas com muitas fotografias. Depois da conversão, cada página pode ser baixada separadamente ou todas podem ser reunidas em um arquivo ZIP.",
  ],
  useCases: [
    { title: "Prévia de documentos", description: "Gere imagens de páginas para catálogos, sistemas internos e interfaces que não exibem PDF diretamente." },
    { title: "Apresentações", description: "Transforme páginas finalizadas em imagens para inserir em slides ou outros materiais visuais." },
    { title: "Compartilhamento de páginas", description: "Baixe páginas específicas em PNG ou JPG quando não for necessário enviar o documento completo." },
    { title: "Referência visual", description: "Crie cópias rasterizadas de formulários, diagramas e comprovantes sem alterar o PDF original." },
  ],
  steps: [
    "Selecione um arquivo PDF que possa ser aberto no navegador.",
    "Escolha PNG ou JPG como formato de saída.",
    "Clique em Converter e aguarde a renderização de todas as páginas.",
    "Revise as prévias e baixe páginas individualmente ou use Baixar todas em ZIP.",
  ],
  specifications: [
    { label: "Entrada", value: "Um arquivo PDF compatível e que possa ser aberto sem uma senha que bloqueie a leitura." },
    { label: "Saída", value: "Uma imagem PNG ou JPG para cada página do PDF." },
    { label: "Renderização", value: "As páginas são renderizadas pelo PDF.js em escala 2." },
    { label: "JPG", value: "Gerado pelo navegador com qualidade 0,95 e compressão com perdas." },
    { label: "Download em conjunto", value: "As imagens geradas são reunidas em um arquivo ZIP com nomes pagina-1, pagina-2 e assim por diante." },
    { label: "Conteúdo", value: "A página vira pixels; textos e links não permanecem selecionáveis no resultado." },
  ],
  privacy: "O PDF é lido e renderizado pelo PDF.js no navegador. A conversão não precisa enviar o documento ao Kivai. As imagens permanecem temporariamente na sessão até serem baixadas ou a página ser encerrada.",
  limitations: [
    "PDFs protegidos por senha, corrompidos ou incompatíveis podem não ser abertos.",
    "A ferramenta não executa OCR e não transforma o texto do PDF em conteúdo editável.",
    "Todas as páginas são convertidas; a versão atual não oferece seleção de intervalo antes da conversão.",
    "PDFs muito longos ou com páginas grandes podem consumir bastante memória porque todas as imagens geradas permanecem na sessão até serem substituídas ou limpas.",
    "Fontes, transparências e recursos complexos podem apresentar diferenças conforme o suporte do PDF.js e do navegador.",
  ],
  faqs: [
    { question: "Cada página vira um arquivo separado?", answer: "Sim. É criada uma imagem por página, com download individual disponível." },
    { question: "Posso baixar todas de uma vez?", answer: "Sim. O botão Baixar todas em ZIP reúne as imagens já geradas em um único arquivo ZIP." },
    { question: "Qual formato devo escolher?", answer: "PNG evita compressão com perdas. JPG usa qualidade 0,95 e pode ser mais adequado quando o objetivo é reduzir o tamanho de páginas com muitas fotografias." },
    { question: "O texto continua selecionável?", answer: "Não. A página é rasterizada e o resultado é uma imagem." },
    { question: "Posso escolher somente algumas páginas?", answer: "Não nesta versão. A conversão percorre todas as páginas do PDF selecionado." },
    { question: "O PDF é enviado para um servidor?", answer: "Não. A leitura e a renderização acontecem localmente no navegador." },
  ],
  related: [
    { href: "/ferramentas/imagens-para-pdf", label: "Imagens para PDF" },
    { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
    { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
  ],
};
