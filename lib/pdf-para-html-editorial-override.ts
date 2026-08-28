export const pdfParaHtmlEditorialOverride = {
  overview: [
    "PDF para HTML transforma o texto extraível de um PDF digital em um documento HTML que pode ser visualizado, editado e reutilizado na web. A ferramenta trabalha com a camada de texto existente no arquivo e oferece um modo estruturado, voltado à semântica, e um modo visual que reposiciona o texto para aproximar o layout original.",
    "PDF e HTML possuem modelos diferentes: PDF prioriza páginas fixas, enquanto HTML reorganiza o conteúdo conforme tela, fontes e CSS. Por isso, documentos simples, com texto selecionável e uma coluna, tendem a produzir resultados mais previsíveis. Imagens, vetores, fundos e outros elementos gráficos do PDF não são reconstruídos pelo modo visual.",
  ],
  useCases: [
    { title: "Migrar conteúdo para sites", description: "Recupere títulos, parágrafos e listas de manuais, relatórios e materiais que existem apenas em PDF." },
    { title: "Preparar artigos e páginas", description: "Use o HTML gerado como ponto de partida para conteúdo editorial, documentação ou áreas administrativas." },
    { title: "Revisar estrutura", description: "Compare a visualização com o código e faça pequenos ajustes antes de reutilizar o conteúdo." },
    { title: "Selecionar páginas", description: "Converta apenas intervalos úteis quando o documento completo não precisa ser transformado." },
  ],
  steps: [
    "Selecione um PDF digital com texto selecionável, de até 25 MB e no máximo 50 páginas.",
    "Informe as páginas desejadas ou deixe o campo vazio para usar todas.",
    "Escolha HTML estruturado ou Aproximar aparência do texto e inicie a conversão.",
    "Revise a visualização e o código antes de copiar ou baixar o arquivo HTML.",
  ],
  specifications: [
    { label: "Entrada", value: "Um PDF digital de até 25 MB e no máximo 50 páginas." },
    { label: "Saída", value: "Documento HTML5 em UTF-8 com CSS incorporado." },
    { label: "Modo estruturado", value: "Reconstrói títulos, parágrafos, listas e tenta identificar tabelas simples por heurística de espaçamento." },
    { label: "Modo visual", value: "Reposiciona o texto extraído por coordenadas para aproximar o layout, sem reconstruir imagens, vetores ou fundos." },
  ],
  privacy: "A inspeção, a extração de texto e a geração do HTML acontecem localmente no navegador. O PDF não precisa ser enviado ao Kivai para essa conversão.",
  limitations: [
    "A versão atual não executa OCR; PDFs compostos somente por imagens precisam de reconhecimento de texto antes.",
    "Imagens, vetores, fundos e outros elementos gráficos do PDF não são reconstruídos no HTML.",
    "A identificação de tabelas é heurística e funciona melhor em estruturas simples com colunas visualmente separadas.",
    "Múltiplas colunas, fontes específicas, elementos sobrepostos e layouts complexos podem exigir revisão manual.",
    "O modo visual reposiciona texto e não garante reprodução idêntica da página original.",
  ],
  faqs: [
    { question: "O HTML gerado pode ser editado?", answer: "Sim. A ferramenta permite revisar o código, fazer pequenos ajustes, desfazer e refazer alterações e restaurar a versão originalmente gerada." },
    { question: "PDF digitalizado funciona?", answer: "Não diretamente quando a página contém apenas imagem. Esta versão não inclui OCR." },
    { question: "Posso converter apenas algumas páginas?", answer: "Sim. São aceitos números, listas e intervalos, como 1-5,8." },
    { question: "O layout ficará idêntico ao PDF?", answer: "Não. O modo visual apenas reposiciona o texto extraído para aproximar o layout; imagens, gráficos, vetores e fundos não são reconstruídos." },
    { question: "A ferramenta converte tabelas?", answer: "Ela tenta reconhecer tabelas simples usando espaçamento e alinhamento dos textos. Estruturas complexas podem não ser identificadas corretamente." },
  ],
  related: [
    { href: "/ferramentas/html-para-pdf", label: "HTML para PDF" },
    { href: "/ferramentas/pdf-para-word", label: "PDF para Word" },
    { href: "/ferramentas/pdf-para-excel", label: "PDF para Excel" },
    { href: "/ferramentas/pdf-para-imagens", label: "PDF para Imagens" },
    { href: "/ferramentas/editar-pdf", label: "Editar PDF" },
  ],
} as const;
