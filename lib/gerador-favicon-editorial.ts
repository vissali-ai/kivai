export const geradorFaviconEditorial = {
  overview: [
    "O Gerador de Favicon cria um conjunto de ícones quadrados a partir de uma imagem PNG, JPG ou WebP de até 20 MB. A ferramenta gera arquivos PNG em vários tamanhos, um arquivo favicon.ico e um pacote ZIP com todos os resultados para facilitar a implementação no site.",
    "Os PNGs gerados usam os tamanhos 16×16, 32×32, 48×48, 64×64, 180×180, 192×192 e 512×512 pixels. O arquivo favicon.ico reúne as versões de 16×16, 32×32 e 48×48 pixels. Também são criados arquivos com nomes usuais para Apple Touch e Android Chrome.",
    "A imagem enviada é redimensionada mantendo sua proporção e centralizada dentro de uma área quadrada. Se o arquivo original não for quadrado, a ferramenta não corta as bordas para preencher o espaço; por isso, podem surgir áreas transparentes ao redor do conteúdo.",
  ],
  useCases: [
    { title: "Identidade visual de sites", description: "Gere os arquivos usados em abas do navegador, favoritos e outros pontos em que o site exibe um ícone." },
    { title: "Apple Touch e Android", description: "Crie versões maiores nomeadas para atalhos e ícones usados em dispositivos e navegadores compatíveis." },
    { title: "Atualização de marca", description: "Substitua um favicon antigo por novas versões derivadas do símbolo ou logotipo atual do projeto." },
    { title: "Entrega para desenvolvimento", description: "Baixe todos os arquivos em ZIP e entregue o conjunto para quem fará a configuração do site ou da aplicação." },
  ],
  steps: [
    "Selecione uma imagem PNG, JPG ou WebP com até 20 MB.",
    "Confira a prévia e clique em “Gerar favicons”.",
    "Revise as versões geradas nos tamanhos disponíveis.",
    "Baixe o favicon.ico, um PNG específico ou o pacote completo em ZIP.",
    "Depois do download, publique e referencie os arquivos na configuração do seu site ou aplicação.",
  ],
  specifications: [
    { label: "Entrada", value: "Imagem PNG, JPG ou WebP com até 20 MB." },
    { label: "PNGs gerados", value: "16×16, 32×32, 48×48, 64×64, 180×180, 192×192 e 512×512 pixels." },
    { label: "favicon.ico", value: "Arquivo ICO contendo versões de 16×16, 32×32 e 48×48 pixels." },
    { label: "Arquivos nomeados", value: "Inclui apple-touch-icon.png, android-chrome-192x192.png e android-chrome-512x512.png, além dos tamanhos para navegador." },
    { label: "Enquadramento", value: "A imagem mantém a proporção e é centralizada dentro do quadrado, sem recorte automático para preencher toda a área." },
    { label: "Downloads", value: "favicon.ico, PNGs individuais e pacote favicons.zip com todos os arquivos gerados." },
  ],
  privacy: "A imagem é aberta, redimensionada e transformada nos arquivos de favicon dentro do navegador. O arquivo enviado não precisa ser transferido para um serviço externo para gerar as versões disponíveis. Os downloads só são salvos quando o usuário escolhe baixar um arquivo ou o ZIP.",
  limitations: [
    "A ferramenta gera os arquivos, mas não instala o favicon nem altera automaticamente o HTML, o manifest ou a configuração do site.",
    "Imagens retangulares mantêm a proporção e podem ficar com áreas transparentes ao redor, pois a ferramenta não faz recorte automático para preencher o quadrado.",
    "Textos pequenos, detalhes finos e elementos muito próximos das bordas podem perder legibilidade em tamanhos como 16×16 e 32×32 pixels.",
    "Gerar tamanhos maiores não adiciona detalhes que não existiam na imagem original; uma fonte pequena ou desfocada continuará limitada pela qualidade de origem.",
    "O navegador ou o sistema operacional pode manter versões antigas do favicon em cache mesmo depois de novos arquivos serem publicados.",
  ],
  faqs: [
    { question: "Quais tamanhos são gerados?", answer: "A ferramenta gera PNGs de 16×16, 32×32, 48×48, 64×64, 180×180, 192×192 e 512×512 pixels." },
    { question: "O que existe dentro do favicon.ico?", answer: "O arquivo ICO gerado reúne as versões de 16×16, 32×32 e 48×48 pixels." },
    { question: "A ferramenta recorta minha imagem para deixá-la quadrada?", answer: "Não. Ela mantém a proporção da imagem e a centraliza em uma área quadrada. Se a imagem for retangular, podem permanecer espaços transparentes ao redor." },
    { question: "O favicon é aplicado automaticamente no meu site?", answer: "Não. Depois do download, os arquivos precisam ser publicados e referenciados no HTML, no framework ou na configuração da aplicação." },
    { question: "Qual imagem costuma funcionar melhor?", answer: "Símbolos simples, centralizados e com bom contraste costumam permanecer mais reconhecíveis em tamanhos pequenos. Evite textos longos e detalhes muito finos." },
    { question: "Posso baixar tudo de uma vez?", answer: "Sim. O botão de ZIP reúne o favicon.ico e todos os PNGs gerados em um único arquivo favicons.zip." },
  ],
  related: [
    { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
    { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
    { href: "/ferramentas/conversor-svg-png", label: "Converter SVG e PNG" },
  ],
} as const;
