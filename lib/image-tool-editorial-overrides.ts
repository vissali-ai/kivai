export const imageToolEditorialOverrides = {
  "compressor-de-imagens": {
    overview: [
      "O Compressor de Imagens reduz o peso de arquivos JPG, PNG e WebP sem alterar suas dimensões. Em JPG e WebP, é possível escolher entre diferentes níveis de compressão; em PNG, a redução depende da estrutura do arquivo e mantém a transparência quando ela estiver presente.",
      "A ferramenta compara o arquivo original com o resultado e só utiliza a nova versão quando ela realmente ocupa menos espaço. Se o processamento não conseguir gerar uma versão menor, o Kivai mantém o arquivo original em vez de entregar uma cópia maior.",
    ],
    useCases: [
      { title: "Desempenho de páginas", description: "Reduza imagens de banners, artigos e vitrines para diminuir o volume transferido durante o carregamento." },
      { title: "Envio por e-mail", description: "Prepare anexos menores quando o provedor impõe limite de tamanho ou a conexão do destinatário é lenta." },
      { title: "Lojas e catálogos", description: "Otimize fotografias de produtos sem alterar o fluxo de publicação ou instalar um programa de edição." },
      { title: "WhatsApp e compartilhamento", description: "Reduza o peso de fotografias antes de enviar por aplicativos, formulários ou plataformas com limite de arquivo." },
    ],
    steps: [
      "Selecione uma imagem PNG, JPG ou WebP com até 5 MB.",
      "Escolha entre compressão Leve, Equilibrada ou Máxima.",
      "Clique em “Comprimir imagem” e compare o tamanho original com o resultado.",
      "Confira a prévia e faça o download da versão menor. Se não houver redução, a ferramenta mantém o arquivo original.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG e WebP, com limite de 5 MB por arquivo." },
      { label: "Saída", value: "Imagem no mesmo formato do arquivo original: JPG, PNG ou WebP." },
      { label: "Dimensões", value: "Largura e altura originais são preservadas." },
      { label: "Controle principal", value: "Perfis Leve, Equilibrada e Máxima para JPG e WebP; em PNG, a redução funciona de forma diferente por usar compressão sem perdas." },
      { label: "Medição", value: "Comparação do tamanho original, tamanho final e percentual economizado." },
    ],
    privacy: "O navegador decodifica e recomprime a imagem localmente. O arquivo não é enviado para um serviço de compressão externo. A prévia utiliza um endereço temporário criado no dispositivo e deixa de existir quando a página é fechada ou quando outra imagem é selecionada.",
    limitations: [
      "Nos formatos JPG e WebP, níveis maiores de compressão podem reduzir nitidez, especialmente em textos pequenos, degradês e contornos.",
      "Em PNG, os níveis de qualidade não atuam da mesma forma porque o formato utiliza compressão sem perdas; a redução depende da estrutura do arquivo original.",
      "Uma imagem que já foi fortemente comprimida pode apresentar pouca economia adicional.",
      "Metadados incorporados podem não permanecer na cópia gerada; preserve o original quando essas informações forem importantes.",
      "Para sites, dimensões adequadas e carregamento responsivo são tão importantes quanto o peso final do arquivo.",
    ],
    faqs: [
      { question: "A compressão altera a largura e a altura?", answer: "Não. A ferramenta mantém as dimensões originais da imagem. Para mudar largura ou altura, use a ferramenta específica de redimensionamento." },
      { question: "Qual perfil devo escolher?", answer: "Para JPG e WebP, comece pela opção Equilibrada e confira a prévia. Use Leve quando quiser priorizar qualidade e Máxima quando o tamanho do arquivo for mais importante. Em PNG, a redução funciona de forma diferente porque o formato utiliza compressão sem perdas." },
      { question: "O que acontece se a imagem comprimida ficar maior?", answer: "A ferramenta compara o resultado com o arquivo original. Se não houver redução real, ela mantém o original em vez de entregar uma cópia maior." },
      { question: "É possível recuperar a qualidade perdida?", answer: "Não integralmente nos formatos que usam compressão com perdas. Por isso, mantenha o arquivo original quando ele for importante para edição, impressão ou arquivamento." },
      { question: "Os arquivos são enviados ao servidor?", answer: "Não. A leitura e a criação da nova imagem acontecem no navegador do usuário." },
      { question: "Comprimir melhora automaticamente o SEO?", answer: "Arquivos menores podem ajudar o carregamento, mas SEO também depende de conteúdo, dimensões adequadas, texto alternativo, estabilidade visual e outros fatores." },
    ],
    related: [
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
      { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
      { href: "/ferramentas/gerador-de-placeholder", label: "Gerar placeholder" },
    ],
  },
} as const;
