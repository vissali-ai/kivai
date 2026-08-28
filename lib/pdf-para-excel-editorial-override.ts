export const pdfParaExcelEditorialOverride = {
  overview: [
    "PDF para Excel identifica textos posicionados como linhas e colunas em PDFs digitais e transforma as tabelas reconhecidas em células de uma planilha XLSX. A detecção usa a posição dos textos na página, portanto funciona melhor quando as colunas estão visualmente alinhadas e o PDF possui uma camada de texto real.",
    "Antes da exportação, as tabelas encontradas podem ser revisadas e corrigidas na própria interface. A ferramenta não usa OCR nem um mecanismo semântico de reconhecimento de tabelas: células mescladas, colunas irregulares, textos sobrepostos e layouts complexos podem não ser detectados corretamente.",
  ],
  useCases: [
    { title: "Relatórios e demonstrativos", description: "Reaproveite tabelas regulares que precisam ser filtradas, calculadas ou reorganizadas em uma planilha." },
    { title: "Inventários e listas", description: "Transforme tabelas de produtos, códigos ou registros em células editáveis quando o PDF possuir texto selecionável." },
    { title: "Extração seletiva", description: "Escolha apenas as páginas e tabelas relevantes antes de gerar o arquivo final." },
    { title: "Revisão antes da exportação", description: "Edite células, remova linhas ou colunas e confira números, datas e moedas antes do download." },
  ],
  steps: [
    "Selecione um PDF digital de até 25 MB e no máximo 50 páginas.",
    "Escolha todas as páginas ou informe somente as páginas que contêm as tabelas desejadas.",
    "Analise o PDF e revise cuidadosamente as tabelas reconhecidas pela ferramenta.",
    "Ajuste células e opções de organização e gere o XLSX; quando apenas uma tabela estiver selecionada, também é possível gerar CSV.",
  ],
  specifications: [
    { label: "Entrada", value: "PDF digital de até 25 MB e até 50 páginas, com texto selecionável." },
    { label: "Saída", value: "XLSX; CSV disponível quando somente uma tabela estiver selecionada." },
    { label: "Limite de dados", value: "Até 50.000 células para proteger a estabilidade do navegador." },
    { label: "Detecção", value: "Heurística baseada no posicionamento dos textos; tabelas regulares e alinhadas são o cenário mais previsível." },
  ],
  privacy: "A inspeção do PDF, a extração da camada de texto, a detecção das tabelas e a criação da planilha são executadas localmente no navegador. O arquivo não precisa ser enviado ao Kivai para esta conversão.",
  limitations: [
    "PDFs compostos apenas por imagens precisam de OCR e não são convertidos por esta versão.",
    "A detecção de tabelas é aproximada e baseada em coordenadas; uma tabela pode não ser reconhecida mesmo quando o PDF possui texto selecionável.",
    "Células mescladas, múltiplas colunas de página, sobreposição e alinhamentos irregulares podem exigir correções manuais ou impedir a detecção.",
    "Números, datas, percentuais e moedas podem ser interpretados automaticamente na exportação; confira os valores e formatos antes de usar a planilha em cálculos.",
    "Documentos protegidos por senha ou corrompidos podem não ser analisados, e a ferramenta limita páginas e quantidade de células para evitar consumo excessivo de memória.",
  ],
  faqs: [
    { question: "O resultado fica editável?", answer: "Sim. As células reconhecidas podem ser revisadas na ferramenta e o XLSX pode ser editado em programas de planilha compatíveis." },
    { question: "PDF digitalizado funciona?", answer: "Não quando as páginas contêm apenas imagens. Esta versão não possui OCR e depende da camada de texto existente no PDF." },
    { question: "A ferramenta encontra qualquer tabela?", answer: "Não. A detecção usa o posicionamento dos textos e funciona melhor com tabelas regulares e colunas alinhadas. Layouts complexos podem não ser reconhecidos." },
    { question: "Posso escolher páginas específicas?", answer: "Sim. É possível selecionar páginas visualmente ou informar listas e intervalos, como 1-5,8." },
    { question: "Cada tabela vira uma aba?", answer: "Pode virar. Também existe a opção de reunir as tabelas selecionadas em uma única planilha." },
    { question: "Existe limite de dados?", answer: "Sim. O limite atual é de 50.000 células, além de 25 MB e 50 páginas por PDF." },
  ],
  related: [
    { href: "/ferramentas/pdf-para-word", label: "PDF para Word" },
    { href: "/ferramentas/excel-para-pdf", label: "Excel para PDF" },
    { href: "/ferramentas/pdf-para-powerpoint", label: "PDF para PowerPoint" },
    { href: "/ferramentas/pdf-para-imagens", label: "PDF para Imagens" },
    { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
  ],
} as const;
