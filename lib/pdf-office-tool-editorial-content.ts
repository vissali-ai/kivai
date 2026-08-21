type UseCase = { title: string; description: string };
type Specification = { label: string; value: string };
type Faq = { question: string; answer: string };
type RelatedTool = { href: string; label: string };

type PdfOfficeToolEditorialContent = {
  overview: string[];
  useCases: UseCase[];
  steps: string[];
  specifications: Specification[];
  privacy: string;
  limitations: string[];
  faqs: Faq[];
  related: RelatedTool[];
};

export type PdfOfficeToolEditorialSlug =
  | "pdf-para-word"
  | "word-para-pdf"
  | "pdf-para-excel"
  | "excel-para-pdf"
  | "pdf-para-powerpoint"
  | "powerpoint-para-pdf";

const related = [
  { href: "/ferramentas/pdf-para-word", label: "PDF para Word" },
  { href: "/ferramentas/word-para-pdf", label: "Word para PDF" },
  { href: "/ferramentas/pdf-para-excel", label: "PDF para Excel" },
  { href: "/ferramentas/excel-para-pdf", label: "Excel para PDF" },
  { href: "/ferramentas/pdf-para-powerpoint", label: "PDF para PowerPoint" },
  { href: "/ferramentas/powerpoint-para-pdf", label: "PowerPoint para PDF" },
  { href: "/ferramentas/pdf-para-imagens", label: "PDF para Imagens" },
  { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
];

export const pdfOfficeToolEditorialContent = {
  "pdf-para-word": {
    overview: [
      "PDF para Word transforma o texto e a estrutura reconhecidos em um arquivo PDF em um documento DOCX editável. A conversão é útil quando o conteúdo precisa ser corrigido, reorganizado ou reutilizado sem refazer o documento inteiro.",
      "A ferramenta trabalha melhor com PDFs digitais que já possuem texto selecionável. Títulos, parágrafos, listas, estilos e quebras de página são reconstruídos no DOCX quando identificados, mas layouts complexos podem exigir revisão depois do download.",
    ],
    useCases: [
      { title: "Revisar documentos", description: "Recupere textos de relatórios, propostas e contratos para realizar alterações em um editor compatível com DOCX." },
      { title: "Reaproveitar conteúdo", description: "Transforme materiais já finalizados em uma base editável para novas versões." },
      { title: "Converter vários arquivos", description: "Processe mais de um PDF e receba os DOCX reunidos em ZIP." },
      { title: "Recuperar um original perdido", description: "Use o PDF como fonte quando o documento Word original não estiver mais disponível." },
    ],
    steps: [
      "Selecione um ou vários arquivos PDF de até 20 MB cada.",
      "Confira nome, tamanho e quantidade de páginas dos documentos.",
      "Clique em Converter para Word e aguarde o processamento.",
      "Baixe o DOCX gerado ou o ZIP quando houver vários resultados e revise a formatação.",
    ],
    specifications: [
      { label: "Entrada", value: "Um ou vários arquivos PDF, com até 20 MB por arquivo." },
      { label: "Saída", value: "DOCX editável; vários resultados são reunidos em ZIP." },
      { label: "Melhor cenário", value: "PDF digital com texto selecionável e estrutura relativamente regular." },
      { label: "Digitalizações", value: "PDFs formados apenas por imagens precisam de OCR, que não faz parte desta versão." },
    ],
    privacy: "A leitura do PDF, a reconstrução do conteúdo e a geração do DOCX acontecem localmente no navegador. Os arquivos não precisam ser enviados ao Kivai para a conversão.",
    limitations: [
      "PDFs protegidos por senha ou com restrições que impeçam a leitura precisam ser desbloqueados com autorização antes da conversão.",
      "Colunas, tabelas irregulares, formulários, caixas de texto e outros layouts complexos podem exigir ajustes no Word.",
      "Fontes não disponíveis no dispositivo podem ser substituídas pelo editor que abrir o DOCX.",
      "A ferramenta não executa OCR em páginas que contenham somente imagens digitalizadas.",
    ],
    faqs: [
      { question: "O arquivo Word fica editável?", answer: "Sim. O conteúdo textual reconhecido é inserido em um arquivo DOCX que pode ser aberto e editado em programas compatíveis." },
      { question: "Posso converter vários PDFs?", answer: "Sim. Cada PDF gera um DOCX e, quando há vários arquivos, os resultados são reunidos em um ZIP." },
      { question: "PDF digitalizado funciona?", answer: "Não quando a página contém somente uma imagem. Nesse caso seria necessário OCR para reconhecer o texto." },
      { question: "Qual é o limite por arquivo?", answer: "O limite atual é de 20 MB para cada PDF." },
      { question: "Os PDFs são enviados ao servidor?", answer: "Não. O processamento desta ferramenta acontece localmente no navegador." },
    ],
    related,
  },
  "word-para-pdf": {
    overview: [
      "Word para PDF converte documentos DOCX em um arquivo PDF destinado a leitura, impressão e compartilhamento. O navegador interpreta a estrutura do documento, prepara as páginas e gera uma nova cópia em PDF.",
      "Textos, títulos, listas, imagens, tabelas, alinhamentos e quebras de página tendem a ser preservados, mas elementos avançados do Word podem ser renderizados de forma diferente fora do Microsoft Word.",
    ],
    useCases: [
      { title: "Compartilhar versões finais", description: "Gere uma cópia com aparência mais estável para propostas, currículos, trabalhos e documentos comerciais." },
      { title: "Preparar impressão", description: "Converta o DOCX para um formato amplamente aceito por gráficas e fluxos de impressão." },
      { title: "Evitar alterações acidentais", description: "Distribua uma versão final em PDF mantendo o DOCX original separado para edição." },
      { title: "Compatibilidade", description: "Crie um arquivo que possa ser aberto sem exigir um editor de documentos Word." },
    ],
    steps: [
      "Selecione um arquivo DOCX compatível.",
      "Confira a pré-visualização preparada no navegador.",
      "Ajuste orientação e tamanho de página quando necessário.",
      "Converta para PDF, revise o resultado e faça o download.",
    ],
    specifications: [
      { label: "Entrada", value: "Documento DOCX. O formato antigo DOC não é aceito nesta versão." },
      { label: "Saída", value: "Arquivo PDF pronto para leitura, compartilhamento ou impressão." },
      { label: "Configurações", value: "Orientação e tamanho de página podem ser ajustados antes da geração." },
      { label: "Compatibilidade", value: "Documentos com recursos avançados podem apresentar diferenças de renderização." },
    ],
    privacy: "A leitura do DOCX, a renderização das páginas e a geração do PDF são executadas no navegador. O documento não precisa ser enviado ao Kivai.",
    limitations: [
      "Arquivos DOC antigos devem ser salvos como DOCX antes da conversão.",
      "Fontes indisponíveis, caixas de texto, equações, colunas e outros recursos avançados podem apresentar diferenças.",
      "Documentos muito grandes ou com muitas imagens podem exigir mais memória e funcionar melhor em computadores.",
      "O PDF final não mantém fórmulas ou estruturas editáveis do DOCX como objetos do Word.",
    ],
    faqs: [
      { question: "A formatação do Word será mantida?", answer: "A conversão procura preservar os principais elementos do documento, mas recursos avançados podem apresentar diferenças e devem ser revisados na prévia." },
      { question: "A ferramenta aceita arquivos DOC?", answer: "Não. Esta versão aceita DOCX; arquivos DOC precisam ser salvos no formato moderno antes do uso." },
      { question: "Funciona no celular?", answer: "Sim em navegadores modernos, embora documentos maiores possam exigir mais memória." },
      { question: "Posso editar o PDF depois?", answer: "O PDF é voltado principalmente para leitura e compartilhamento. Para alterar o conteúdo, edite o DOCX original e converta novamente." },
      { question: "O documento é enviado ao Kivai?", answer: "Não. O processamento ocorre localmente no navegador." },
    ],
    related,
  },
  "pdf-para-excel": {
    overview: [
      "PDF para Excel identifica textos organizados como tabelas em PDFs digitais e os transforma em células de uma planilha XLSX. Antes da exportação, os dados encontrados podem ser revisados e corrigidos na própria interface.",
      "A detecção considera a posição dos textos na página. Tabelas regulares com colunas alinhadas costumam produzir resultados melhores do que layouts com células mescladas, sobreposição ou múltiplas colunas de página.",
    ],
    useCases: [
      { title: "Relatórios e demonstrativos", description: "Reaproveite tabelas que precisam ser filtradas, calculadas ou reorganizadas em planilha." },
      { title: "Inventários e listas", description: "Transforme tabelas de produtos, códigos ou registros em células editáveis." },
      { title: "Extração seletiva", description: "Escolha apenas as páginas e tabelas relevantes antes de gerar o arquivo final." },
      { title: "Revisão antes da exportação", description: "Edite células, remova linhas ou colunas e escolha a organização das abas antes do download." },
    ],
    steps: [
      "Selecione um PDF de até 25 MB e no máximo 50 páginas.",
      "Escolha todas as páginas ou informe somente as páginas que contêm tabelas.",
      "Analise o PDF e revise as tabelas encontradas.",
      "Ajuste células e opções de organização e gere o XLSX; uma única tabela também pode ser baixada em CSV.",
    ],
    specifications: [
      { label: "Entrada", value: "PDF digital de até 25 MB e até 50 páginas." },
      { label: "Saída", value: "XLSX; CSV disponível quando somente uma tabela estiver selecionada." },
      { label: "Limite de dados", value: "Até 50.000 células para proteger a estabilidade do navegador." },
      { label: "Organização", value: "Uma aba por tabela ou todas as tabelas reunidas em uma planilha." },
    ],
    privacy: "A inspeção do PDF, a extração dos textos e a criação da planilha são executadas no navegador pelas rotinas da própria ferramenta. O arquivo não precisa ser enviado ao Kivai.",
    limitations: [
      "PDFs compostos apenas por imagens precisam de OCR e não são convertidos por esta versão.",
      "Layouts complexos podem exigir correções manuais na prévia antes da exportação.",
      "Documentos protegidos por senha ou corrompidos podem não ser analisados.",
      "A ferramenta limita páginas e quantidade de células para evitar consumo excessivo de memória.",
    ],
    faqs: [
      { question: "O resultado fica editável?", answer: "Sim. As células podem ser revisadas na ferramenta e o XLSX pode ser editado em programas de planilha compatíveis." },
      { question: "PDF digitalizado funciona?", answer: "Não nesta versão, porque a ferramenta depende do texto já existente dentro do PDF." },
      { question: "Posso escolher páginas específicas?", answer: "Sim. É possível selecionar páginas visualmente ou informar intervalos e listas." },
      { question: "Cada tabela vira uma aba?", answer: "Pode virar. A ferramenta também oferece a opção de reunir todas as tabelas em uma única planilha." },
      { question: "Existe limite de dados?", answer: "Sim. O limite atual é de 50.000 células." },
    ],
    related,
  },
  "excel-para-pdf": {
    overview: [
      "Excel para PDF transforma planilhas XLSX em páginas de PDF, permitindo escolher e ordenar abas e ajustar orientação, papel, margens, escala e linhas de grade antes da geração.",
      "A conversão preserva principalmente o conteúdo visual das células. Resultados armazenados de fórmulas podem aparecer no PDF, mas fórmulas editáveis e recursos avançados do Excel não são mantidos como elementos interativos.",
    ],
    useCases: [
      { title: "Relatórios", description: "Crie uma versão fixa de demonstrativos e planilhas para distribuição." },
      { title: "Impressão", description: "Ajuste orientação, tamanho do papel e escala para reduzir cortes de colunas." },
      { title: "Arquivamento", description: "Gere uma cópia em PDF de planilhas que precisam ser consultadas sem edição." },
      { title: "Seleção de abas", description: "Converta apenas as abas necessárias e defina a ordem em que aparecerão no PDF." },
    ],
    steps: [
      "Selecione um arquivo XLSX compatível.",
      "Escolha as abas e organize a sequência desejada.",
      "Ajuste orientação, tamanho do papel, escala, margens e linhas de grade.",
      "Prepare a prévia, confira as páginas e gere o PDF para download.",
    ],
    specifications: [
      { label: "Entrada", value: "Arquivo XLSX. O formato XLS antigo não é aceito." },
      { label: "Saída", value: "PDF organizado pelas abas e páginas preparadas na ferramenta." },
      { label: "Limites", value: "Até 25 MB, 20 abas, 50.000 células utilizadas e até 100 páginas geradas." },
      { label: "Papel", value: "A4, Carta e Ofício, com orientação e margens configuráveis." },
    ],
    privacy: "A planilha é lida e transformada em páginas dentro do navegador. A geração do PDF ocorre localmente e não exige o envio do XLSX ao Kivai.",
    limitations: [
      "Arquivos XLS antigos precisam ser convertidos para XLSX antes do uso.",
      "Gráficos, imagens, objetos e recursos avançados podem apresentar diferenças de posição ou aparência.",
      "Fórmulas não são recalculadas pela ferramenta; ela depende dos resultados armazenados no arquivo.",
      "Planilhas extensas podem atingir os limites de abas, células ou páginas definidos para estabilidade do navegador.",
    ],
    faqs: [
      { question: "Posso escolher quais abas converter?", answer: "Sim. Você pode selecionar, excluir, restaurar e reorganizar as abas antes de preparar o PDF." },
      { question: "As fórmulas serão preservadas?", answer: "O PDF mostra os resultados armazenados, não as fórmulas editáveis. Fórmulas sem resultado salvo podem ficar em branco." },
      { question: "Como evitar colunas cortadas?", answer: "Use orientação paisagem, margens menores e o ajuste de todas as colunas em uma página." },
      { question: "Gráficos e imagens ficam iguais?", answer: "Não há garantia de fidelidade total para elementos avançados; a prévia deve ser revisada antes do download." },
      { question: "A planilha é enviada ao servidor?", answer: "Não. A conversão desta ferramenta ocorre localmente no navegador." },
    ],
    related,
  },
  "pdf-para-powerpoint": {
    overview: [
      "PDF para PowerPoint transforma páginas selecionadas de um PDF em slides de uma apresentação PPTX. Cada página é renderizada como imagem e inserida em um slide, priorizando a fidelidade visual ao documento de origem.",
      "Como a página entra no PowerPoint como uma imagem única, o slide pode ser reorganizado, duplicado e complementado, mas textos, tabelas e imagens internas do PDF não se tornam objetos editáveis separados.",
    ],
    useCases: [
      { title: "Apresentações rápidas", description: "Leve páginas prontas de relatórios, apostilas e propostas para uma apresentação sem reconstruir o layout." },
      { title: "Materiais de treinamento", description: "Converta páginas selecionadas em slides para adicionar comentários ou conteúdos complementares." },
      { title: "Reorganização", description: "Selecione somente as páginas necessárias e defina a ordem dos slides antes da geração." },
      { title: "Fidelidade visual", description: "Use a renderização como imagem quando preservar a aparência for mais importante que editar cada elemento." },
    ],
    steps: [
      "Selecione um PDF de até 25 MB e com no máximo 50 páginas.",
      "Escolha as páginas que deverão virar slides e organize a ordem.",
      "Ajuste formato, encaixe e qualidade da renderização.",
      "Converta para PowerPoint e baixe o arquivo PPTX gerado.",
    ],
    specifications: [
      { label: "Entrada", value: "Um arquivo PDF de até 25 MB e até 50 páginas." },
      { label: "Saída", value: "Apresentação PPTX com uma página renderizada por slide." },
      { label: "Edição", value: "Os slides podem ser reorganizados, mas o conteúdo original de cada página permanece como imagem." },
      { label: "Qualidade", value: "A ferramenta oferece opções de qualidade para a renderização das páginas." },
    ],
    privacy: "A leitura do PDF, a criação das imagens das páginas e a montagem do PPTX acontecem no navegador. O documento não precisa ser enviado ao Kivai.",
    limitations: [
      "Textos e objetos do PDF não ficam separados ou diretamente editáveis dentro do PowerPoint.",
      "A nitidez depende da resolução do PDF e da qualidade de renderização escolhida.",
      "PDFs protegidos ou corrompidos podem não ser processados.",
      "Arquivos extensos podem consumir bastante memória durante a renderização dos slides.",
    ],
    faqs: [
      { question: "Cada página vira um slide?", answer: "Sim. Cada página selecionada gera um slide na ordem definida pelo usuário." },
      { question: "Os textos ficam editáveis?", answer: "Não separadamente. A página do PDF é inserida como uma imagem única para preservar o visual." },
      { question: "Posso escolher e reordenar páginas?", answer: "Sim. A seleção e a ordem podem ser alteradas antes da conversão." },
      { question: "Qual é o limite atual?", answer: "Até 25 MB e 50 páginas por PDF." },
      { question: "O PDF é enviado para algum servidor?", answer: "Não. O processamento desta ferramenta acontece no navegador." },
    ],
    related,
  },
  "powerpoint-para-pdf": {
    overview: [
      "PowerPoint para PDF converte apresentações PPTX em páginas de PDF. A ferramenta inspeciona os slides, gera prévias, permite selecionar e reorganizar a sequência e então cria o documento final.",
      "Textos, imagens, formas, gráficos, cores e fundos são renderizados visualmente antes de entrarem no PDF. Fontes indisponíveis e recursos específicos do PowerPoint podem produzir diferenças em relação ao arquivo original.",
    ],
    useCases: [
      { title: "Distribuição de apresentações", description: "Crie uma versão final para compartilhar sem exigir o PowerPoint no dispositivo de destino." },
      { title: "Impressão", description: "Transforme slides em um PDF adequado para consulta e impressão." },
      { title: "Seleção de slides", description: "Converta somente os slides necessários e reorganize a sequência antes da geração." },
      { title: "Arquivamento", description: "Mantenha uma cópia visual da apresentação em um formato amplamente suportado." },
    ],
    steps: [
      "Selecione uma apresentação PPTX de até 25 MB e no máximo 50 slides.",
      "Confira as miniaturas e escolha os slides que deseja incluir.",
      "Organize a sequência e ajuste orientação, tamanho de página e qualidade.",
      "Converta para PDF, confira o resultado e faça o download.",
    ],
    specifications: [
      { label: "Entrada", value: "Arquivo PPTX de até 25 MB e até 50 slides." },
      { label: "Saída", value: "PDF com os slides selecionados na ordem definida." },
      { label: "Formato antigo", value: "PPT não é aceito; o arquivo precisa ser salvo como PPTX." },
      { label: "Renderização", value: "Cada slide é reconstruído visualmente antes de ser inserido no PDF." },
    ],
    privacy: "A apresentação é inspecionada, renderizada e convertida dentro do navegador. O arquivo PPTX não precisa ser enviado ao Kivai para gerar o PDF.",
    limitations: [
      "Arquivos PPT antigos precisam ser salvos como PPTX antes da conversão.",
      "Fontes ausentes e recursos específicos do PowerPoint podem apresentar pequenas diferenças visuais.",
      "Apresentações grandes podem consumir bastante memória durante a renderização.",
      "Elementos interativos, animações e transições não são preservados como recursos ativos em um PDF estático.",
    ],
    faqs: [
      { question: "Posso escolher quais slides converter?", answer: "Sim. A ferramenta permite selecionar, remover e reorganizar os slides antes da geração." },
      { question: "O layout será preservado?", answer: "A ferramenta busca reproduzir o conteúdo visual, mas fontes indisponíveis e recursos avançados podem apresentar diferenças." },
      { question: "Arquivos PPT antigos funcionam?", answer: "Não. Esta versão aceita somente PPTX." },
      { question: "Qual é o limite atual?", answer: "Até 25 MB e 50 slides por arquivo PPTX." },
      { question: "A apresentação é enviada ao servidor?", answer: "Não. A conversão ocorre localmente no navegador." },
    ],
    related,
  },
} satisfies Record<PdfOfficeToolEditorialSlug, PdfOfficeToolEditorialContent>;
