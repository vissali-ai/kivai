export const conversorSvgPngEditorial = {
  overview: [
    "O Conversor SVG ↔ PNG trabalha em dois sentidos diferentes. Ao receber um arquivo SVG, a ferramenta o renderiza como uma imagem PNG. Ao receber PNG, JPG ou WebP, cria um arquivo SVG que incorpora a imagem rasterizada original dentro de um contêiner SVG.",
    "Na conversão SVG → PNG, você define a largura final entre 16 e 4096 pixels e a altura é calculada proporcionalmente a partir das dimensões do SVG carregado. O resultado é uma imagem PNG rasterizada, adequada para aplicações que não aceitam SVG.",
    "Na direção Imagem → SVG, não ocorre vetorização automática. Pixels não são convertidos em curvas, formas ou caminhos editáveis. O arquivo SVG resultante mantém a imagem PNG, JPG ou WebP incorporada como conteúdo rasterizado nas dimensões originais.",
  ],
  useCases: [
    { title: "Compatibilidade com sistemas", description: "Transforme um SVG em PNG quando uma plataforma, editor, formulário ou aplicativo não aceitar o formato vetorial." },
    { title: "Exportação em tamanho definido", description: "Escolha a largura do PNG antes de rasterizar um SVG, mantendo a proporção calculada pela ferramenta." },
    { title: "Empacotamento em SVG", description: "Coloque uma imagem PNG, JPG ou WebP dentro de um arquivo SVG quando um fluxo técnico exigir esse tipo de contêiner." },
    { title: "Protótipos e desenvolvimento", description: "Gere rapidamente uma cópia rasterizada de um recurso SVG ou um SVG contendo uma imagem incorporada para testes de compatibilidade." },
  ],
  steps: [
    "Selecione um arquivo SVG, PNG, JPG ou WebP com até 20 MB.",
    "A ferramenta identifica automaticamente o sentido da conversão conforme o formato selecionado.",
    "Se o arquivo for SVG, informe a largura desejada para o PNG entre 16 e 4096 px; a altura será calculada proporcionalmente.",
    "Clique em “Converter” para gerar o novo arquivo.",
    "Baixe o PNG rasterizado ou o SVG com a imagem incorporada, conforme o tipo de entrada utilizado.",
  ],
  specifications: [
    { label: "Entrada", value: "SVG, PNG, JPG/JPEG ou WebP, com limite de 20 MB por arquivo." },
    { label: "SVG → PNG", value: "Rasterização do SVG em PNG com largura configurável de 16 a 4096 px e altura proporcional." },
    { label: "Imagem → SVG", value: "PNG, JPG ou WebP é incorporado como imagem rasterizada dentro de um arquivo SVG nas dimensões originais." },
    { label: "Vetorização", value: "Não há rastreamento de pixels nem conversão automática para curvas, paths ou formas vetoriais editáveis." },
    { label: "Quantidade", value: "Um arquivo por conversão." },
    { label: "Saída", value: "PNG para entrada SVG; SVG para entrada PNG, JPG ou WebP." },
  ],
  privacy: "A leitura do arquivo, a rasterização do SVG e a criação do novo conteúdo acontecem no navegador. O arquivo selecionado é usado durante a sessão para gerar o resultado e só é salvo no dispositivo quando o usuário inicia o download.",
  limitations: [
    "Converter SVG para PNG remove a natureza vetorial do conteúdo. O PNG gerado passa a ter resolução fixa em pixels.",
    "A opção Imagem → SVG não vetoriza fotografias, logos ou ilustrações. Ela apenas incorpora a imagem rasterizada dentro de um documento SVG.",
    "Ampliar posteriormente o SVG criado a partir de PNG, JPG ou WebP não cria detalhes adicionais, porque a imagem interna continua sendo rasterizada.",
    "A ferramenta não oferece edição de paths, simplificação de formas, remoção de fundo ou rastreamento de contornos.",
    "Metadados e características específicas do arquivo original podem não ser reproduzidos da mesma forma no resultado convertido.",
  ],
  faqs: [
    { question: "PNG para SVG vira vetor de verdade?", answer: "Não. A ferramenta cria um arquivo SVG que contém a imagem rasterizada incorporada. Os pixels não são transformados em curvas ou formas vetoriais editáveis." },
    { question: "Posso converter JPG ou WebP para SVG?", answer: "Sim. Assim como no PNG, a imagem é incorporada dentro de um contêiner SVG nas dimensões originais, sem vetorização." },
    { question: "Como é definida a altura do PNG ao converter um SVG?", answer: "Você informa a largura entre 16 e 4096 px e a ferramenta calcula a altura proporcionalmente às dimensões do SVG carregado." },
    { question: "O PNG gerado continua vetorial?", answer: "Não. PNG é um formato rasterizado. Depois da conversão, o resultado possui dimensões fixas em pixels." },
    { question: "Consigo editar os elementos do PNG depois de convertê-lo para SVG?", answer: "Não como vetores individuais. O arquivo SVG contém a imagem inteira incorporada, sem separar objetos, textos, linhas ou formas." },
    { question: "A ferramenta aceita vários arquivos de uma vez?", answer: "Não. O fluxo atual trabalha com um arquivo por conversão." },
  ],
  related: [
    { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
    { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
    { href: "/ferramentas/gerador-de-favicon", label: "Gerar favicon" },
  ],
} as const;
