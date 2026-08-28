export const recortarImagemEditorial = {
  overview: [
    "O Recortar Imagem permite escolher visualmente qual parte de uma imagem será mantida. A área de recorte pode ser arrastada, redimensionada pelos quatro cantos ou ajustada por valores exatos de posição e tamanho em pixels.",
    "A ferramenta oferece proporções prontas para facilitar enquadramentos comuns: Livre, 1:1, 4:5, 3:2 e 16:9. Também é possível editar X, Y, largura e altura manualmente. O resultado é uma nova imagem PNG com exatamente as dimensões da área selecionada.",
    "Recortar não amplia, completa nem reconstrói o que ficou fora da seleção. A operação apenas mantém a região escolhida e descarta visualmente o restante na nova cópia.",
  ],
  useCases: [
    { title: "Fotos de produtos", description: "Remova bordas e áreas desnecessárias para destacar o produto antes de publicar em lojas, marketplaces ou catálogos." },
    { title: "Redes sociais", description: "Use proporções como 1:1, 4:5 ou 16:9 para preparar enquadramentos adequados ao layout desejado." },
    { title: "Documentos e apresentações", description: "Isole uma região específica de uma fotografia ou captura de tela antes de inserir no material final." },
    { title: "Recorte por medidas", description: "Informe X, Y, largura e altura quando precisar de uma área exata em pixels." },
  ],
  steps: [
    "Selecione uma imagem PNG, JPG ou WebP.",
    "Arraste a moldura para posicionar a área que deseja manter ou escolha uma proporção pronta: Livre, 1:1, 4:5, 3:2 ou 16:9.",
    "Redimensione a seleção pelas alças dos quatro cantos ou ajuste X, Y, largura e altura pelos campos numéricos.",
    "Clique em “Aplicar recorte” para gerar a nova imagem.",
    "Confira a prévia e as dimensões do resultado e baixe o arquivo em PNG.",
  ],
  specifications: [
    { label: "Entrada", value: "PNG, JPG e WebP." },
    { label: "Seleção", value: "Área retangular ajustável por arraste, pelos quatro cantos ou por valores numéricos." },
    { label: "Proporções prontas", value: "Livre, 1:1, 4:5, 3:2 e 16:9." },
    { label: "Controles numéricos", value: "X, Y, largura e altura em pixels." },
    { label: "Saída", value: "PNG com as mesmas dimensões em pixels da área recortada." },
    { label: "Resultado", value: "A ferramenta mostra uma prévia e informa largura e altura finais antes do download." },
  ],
  privacy: "A imagem é aberta e recortada no navegador. A área selecionada é redesenhada em um canvas local e o arquivo original não é substituído. A nova cópia só é salva quando o usuário faz o download.",
  limitations: [
    "O recorte é sempre retangular; não há seleção livre por contorno, laço ou detecção automática de objetos.",
    "A ferramenta não remove fundo, não apaga objetos e não reconstrói partes que ficaram fora da área escolhida.",
    "Ao selecionar uma proporção pronta, a área é inicialmente centralizada e depois pode ser reposicionada ou redimensionada.",
    "A saída é sempre PNG, mesmo quando o arquivo de entrada é JPG ou WebP.",
    "Metadados e outras informações incorporadas ao arquivo original podem não permanecer na nova cópia gerada pelo navegador.",
  ],
  faqs: [
    { question: "O recorte é feito somente por coordenadas?", answer: "Não. Você pode arrastar a moldura visualmente, redimensionar pelos quatro cantos e também ajustar X, Y, largura e altura em pixels." },
    { question: "Quais proporções prontas estão disponíveis?", answer: "Livre, 1:1, 4:5, 3:2 e 16:9." },
    { question: "Posso recortar uma área em formato circular ou irregular?", answer: "Não. A seleção atual é sempre retangular." },
    { question: "O recorte altera a resolução da área selecionada?", answer: "Não há redimensionamento adicional. A nova imagem recebe exatamente a largura e a altura, em pixels, da região escolhida." },
    { question: "Qual formato é baixado?", answer: "O resultado é sempre gerado em PNG." },
    { question: "O arquivo original é alterado?", answer: "Não. A ferramenta cria uma nova cópia com apenas a região selecionada." },
  ],
  related: [
    { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
    { href: "/ferramentas/espelhar-e-girar-imagem", label: "Espelhar e girar imagem" },
    { href: "/ferramentas/adicionar-marca-dagua", label: "Adicionar marca d'água" },
  ],
} as const;
