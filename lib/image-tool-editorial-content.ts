type UseCase = { title: string; description: string };
type Specification = { label: string; value: string };
type Faq = { question: string; answer: string };
type RelatedTool = { href: string; label: string };

type ImageToolEditorialContent = {
  overview: string[];
  useCases: UseCase[];
  steps: string[];
  specifications: Specification[];
  privacy: string;
  limitations: string[];
  faqs: Faq[];
  related: RelatedTool[];
};

export type ImageToolEditorialSlug =
  | "removedor-de-fundo"
  | "compressor-de-imagens"
  | "conversor-de-imagens"
  | "conversor-heic"
  | "redimensionar-imagem"
  | "gerador-de-qr-code"
  | "gerador-de-favicon"
  | "adicionar-marca-dagua"
  | "conversor-svg-png"
  | "espelhar-e-girar-imagem"
  | "gerador-de-placeholder"
  | "recortar-imagem";

export const imageToolEditorialContent = {
  "removedor-de-fundo": {
    overview: [
      "O Removedor de Fundo identifica o assunto principal de uma fotografia e cria uma nova imagem PNG com transparência ao redor do objeto. A ferramenta é indicada para quem precisa separar produtos, pessoas, animais ou outros elementos do cenário sem recortar manualmente cada contorno.",
      "A análise acontece no navegador e o resultado pode ser comparado com a imagem original antes do download. Fundos simples e com bom contraste normalmente produzem bordas mais precisas; cenas com cabelos soltos, transparências, sombras ou objetos muito parecidos com o fundo podem exigir edição complementar.",
    ],
    useCases: [
      { title: "Catálogos de produtos", description: "Prepare fotos com fundo transparente para lojas virtuais, marketplaces, vitrines e materiais comerciais." },
      { title: "Artes para redes sociais", description: "Isole uma pessoa ou objeto para combinar a imagem com cores, textos e outros elementos de uma composição." },
      { title: "Apresentações e documentos", description: "Remova áreas desnecessárias de logotipos, fotografias e ilustrações antes de inseri-los em slides ou relatórios." },
      { title: "Protótipos rápidos", description: "Crie recortes para testar anúncios, miniaturas e layouts antes de realizar um acabamento detalhado em um editor profissional." },
    ],
    steps: [
      "Selecione uma imagem PNG, JPG ou WebP com até 5 MB.",
      "Aguarde o carregamento do modelo e o processamento da imagem no dispositivo.",
      "Compare a fotografia original com a prévia do recorte gerado.",
      "Baixe o resultado em PNG para preservar o fundo transparente.",
    ],
    specifications: [
      { label: "Entrada", value: "Imagens PNG, JPG ou WebP de até 5 MB." },
      { label: "Saída", value: "Arquivo PNG com canal de transparência." },
      { label: "Processamento", value: "Segmentação automática executada localmente no navegador." },
      { label: "Melhor resultado", value: "Assunto nítido, bem iluminado e visualmente separado do fundo." },
    ],
    privacy: "A imagem selecionada é lida e processada no próprio dispositivo. O arquivo não precisa ser enviado ao Kivai para a remoção do fundo. A velocidade depende da memória disponível, do navegador e do tamanho da fotografia; em aparelhos mais modestos, o primeiro processamento pode levar mais tempo porque o modelo precisa ser preparado.",
    limitations: [
      "Áreas transparentes, reflexos, fumaça, pelos e cabelos finos são difíceis de separar automaticamente.",
      "O resultado não substitui um recorte manual quando a peça exige precisão publicitária ou impressão em grande formato.",
      "Imagens escuras, desfocadas ou com pouco contraste podem perder detalhes nas bordas.",
      "O arquivo final é PNG; a transparência não é preservada se ele for posteriormente convertido para JPG.",
    ],
    faqs: [
      { question: "A remoção de fundo é realmente automática?", answer: "Sim. Um modelo de segmentação analisa a imagem e estima quais pixels pertencem ao assunto principal. Ainda assim, nenhum recorte automático é perfeito em todas as fotografias." },
      { question: "Por que o resultado é baixado em PNG?", answer: "PNG aceita transparência. JPG sempre preenche as áreas transparentes com uma cor e, por isso, não é adequado para preservar o recorte." },
      { question: "A ferramenta funciona no celular?", answer: "Funciona em navegadores modernos, mas imagens grandes e a preparação do modelo podem exigir bastante memória. Um computador tende a ser mais estável para arquivos complexos." },
      { question: "Minha fotografia fica armazenada?", answer: "Não durante a operação normal da ferramenta. A seleção, a análise e a criação do PNG acontecem localmente no navegador." },
      { question: "Como melhorar um recorte impreciso?", answer: "Use uma foto mais nítida, com iluminação uniforme e contraste entre o assunto e o fundo. Depois, se necessário, refine as bordas em um editor de imagens." },
    ],
    related: [
      { href: "/ferramentas/recortar-imagem", label: "Recortar imagem" },
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
      { href: "/ferramentas/adicionar-marca-dagua", label: "Adicionar marca d'água" },
    ],
  },
  "compressor-de-imagens": {
    overview: [
      "O Compressor de Imagens reduz o peso de arquivos destinados a sites, lojas, e-mails e compartilhamentos. Ele recria a imagem com o nível de compressão escolhido e mostra a diferença de tamanho antes do download, permitindo equilibrar economia de dados e aparência visual.",
      "Comprimir não significa apenas diminuir dimensões: o processo reorganiza a representação dos pixels e pode descartar detalhes pouco perceptíveis. Fotografias costumam aceitar uma redução maior que ilustrações com textos, linhas finas ou áreas de cor uniforme, que devem ser conferidas com mais atenção.",
    ],
    useCases: [
      { title: "Desempenho de páginas", description: "Reduza imagens de banners, artigos e vitrines para diminuir o volume transferido durante o carregamento." },
      { title: "Envio por e-mail", description: "Prepare anexos menores quando o provedor impõe limite de tamanho ou a conexão do destinatário é lenta." },
      { title: "Lojas e catálogos", description: "Otimize fotografias de produtos sem alterar o fluxo de publicação ou instalar um programa de edição." },
      { title: "Arquivamento cotidiano", description: "Crie cópias mais leves para consulta e mantenha os originais separados quando a máxima qualidade for necessária." },
    ],
    steps: [
      "Envie uma imagem PNG, JPG ou WebP com até 5 MB.",
      "Escolha o perfil de compressão e confira a indicação de qualidade.",
      "Processe o arquivo e compare o tamanho original com o resultado.",
      "Verifique visualmente a prévia antes de baixar a versão otimizada.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG e WebP, com limite de 5 MB por arquivo." },
      { label: "Saída", value: "Imagem otimizada no formato compatível definido pela ferramenta." },
      { label: "Controle principal", value: "Perfis que priorizam qualidade, equilíbrio ou maior redução." },
      { label: "Medição", value: "Comparação do tamanho original, tamanho final e percentual economizado." },
    ],
    privacy: "O navegador decodifica e recomprime a imagem localmente. O arquivo não é enviado para um serviço de compressão externo. A prévia utiliza um endereço temporário criado no dispositivo e deixa de existir quando a página é fechada ou quando outra imagem é selecionada.",
    limitations: [
      "Toda compressão com perdas pode reduzir nitidez, especialmente em textos pequenos, degradês e contornos.",
      "Uma imagem que já foi fortemente comprimida pode apresentar pouca economia adicional.",
      "Metadados incorporados podem não permanecer na cópia gerada; preserve o original quando essas informações forem importantes.",
      "Para sites, dimensões adequadas e carregamento responsivo são tão importantes quanto o peso final do arquivo.",
    ],
    faqs: [
      { question: "A compressão altera a largura e a altura?", answer: "O objetivo principal é reduzir o peso mantendo as dimensões. Para mudar largura ou altura, use a ferramenta específica de redimensionamento." },
      { question: "Qual perfil devo escolher?", answer: "Comece pelo perfil equilibrado e confira a prévia em tamanho real. Use maior qualidade para artes com texto e maior redução para fotografias de consulta rápida." },
      { question: "É possível recuperar a qualidade perdida?", answer: "Não integralmente. Por isso, mantenha o arquivo original e trate a versão comprimida como uma cópia destinada ao uso final." },
      { question: "Os arquivos são enviados ao servidor?", answer: "Não. A leitura e a criação da nova imagem acontecem no navegador do usuário." },
      { question: "Comprimir melhora automaticamente o SEO?", answer: "Arquivos menores podem ajudar o carregamento, mas SEO também depende de conteúdo, dimensões adequadas, texto alternativo, estabilidade visual e outros fatores." },
    ],
    related: [
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
      { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
      { href: "/ferramentas/gerador-de-placeholder", label: "Gerar placeholder" },
    ],
  },
  "conversor-de-imagens": {
    overview: [
      "O Conversor de Imagens transforma arquivos entre PNG, JPG e WebP. A conversão é útil quando um sistema não aceita o formato original, quando é preciso preservar transparência ou quando se deseja combinar compatibilidade e tamanho de arquivo para publicação na web.",
      "Cada formato possui características próprias. PNG é indicado para transparência, interfaces e gráficos; JPG é comum em fotografias e não aceita transparência; WebP pode oferecer boa relação entre qualidade e tamanho em navegadores e plataformas atuais. A ferramenta permite escolher o formato de saída e ajustar a qualidade quando aplicável.",
    ],
    useCases: [
      { title: "Compatibilidade de plataformas", description: "Converta uma imagem quando um formulário, editor, marketplace ou sistema exige uma extensão específica." },
      { title: "Transparência", description: "Use PNG para manter áreas transparentes em logotipos, recortes e elementos de interface." },
      { title: "Fotografias leves", description: "Gere JPG ou WebP e ajuste a qualidade para equilibrar aparência e peso do arquivo." },
      { title: "Padronização de acervo", description: "Crie cópias em um formato comum para organizar materiais de uma campanha ou projeto." },
    ],
    steps: [
      "Selecione uma imagem PNG, JPG ou WebP de até 5 MB.",
      "Escolha PNG, JPG ou WebP como formato de destino.",
      "Ajuste a qualidade quando o formato escolhido utilizar compressão com perdas.",
      "Converta, revise a prévia e baixe a nova cópia.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG/JPEG e WebP com até 5 MB." },
      { label: "Saída", value: "PNG, JPG ou WebP, conforme a seleção do usuário." },
      { label: "Qualidade", value: "Controle aplicado principalmente às saídas JPG e WebP." },
      { label: "Transparência", value: "Preservada em PNG e WebP compatível; substituída ao gerar JPG." },
    ],
    privacy: "A imagem é aberta e redesenhada em uma área de processamento do próprio navegador. O Kivai não precisa receber o arquivo para realizar a conversão. A cópia final só é salva quando o usuário aciona o download.",
    limitations: [
      "Converter para JPG elimina transparência e pode preencher essas áreas com uma cor de fundo.",
      "A conversão não aumenta detalhes reais de uma imagem pequena ou desfocada.",
      "Perfis de cor e metadados avançados podem ser simplificados pelo navegador.",
      "Renomear apenas a extensão do arquivo não equivale a converter; use o processamento completo da ferramenta.",
    ],
    faqs: [
      { question: "Qual formato gera o menor arquivo?", answer: "Depende do conteúdo e da qualidade escolhida. WebP e JPG costumam ser eficientes para fotografias; PNG é mais adequado quando transparência ou linhas nítidas são prioritárias." },
      { question: "Posso converter JPG para PNG?", answer: "Sim, mas a conversão não recupera transparência ou detalhes que já não existam no JPG original." },
      { question: "O WebP funciona em qualquer lugar?", answer: "É amplamente aceito por navegadores modernos, mas sistemas antigos ou fluxos gráficos específicos podem exigir JPG ou PNG." },
      { question: "A imagem perde qualidade?", answer: "PNG tende a preservar os pixels, enquanto JPG e WebP podem usar compressão com perdas. Confira a prévia e escolha a qualidade adequada." },
      { question: "A conversão é feita localmente?", answer: "Sim. O arquivo é processado no navegador e não precisa ser enviado a um servidor de conversão." },
    ],
    related: [
      { href: "/ferramentas/compressor-de-imagens", label: "Comprimir imagens" },
      { href: "/ferramentas/conversor-heic", label: "Converter HEIC" },
      { href: "/ferramentas/conversor-svg-png", label: "Converter SVG e PNG" },
    ],
  },
  "conversor-heic": {
    overview: [
      "O Conversor HEIC transforma fotografias HEIC ou HEIF em JPG, formato aceito por grande parte dos editores, sites, formulários e aplicativos. HEIC é comum em dispositivos Apple porque armazena imagens com boa eficiência, mas ainda pode falhar em sistemas que não possuem decodificação compatível.",
      "A ferramenta decodifica o arquivo no navegador, cria uma cópia em JPG e apresenta o resultado para download. O original permanece inalterado. Como JPG não trabalha com transparência e utiliza compressão com perdas, a nova cópia pode ter tamanho e características diferentes do arquivo capturado pelo aparelho.",
    ],
    useCases: [
      { title: "Formulários e cadastros", description: "Prepare fotos do iPhone para serviços que aceitam JPG, mas rejeitam arquivos HEIC ou HEIF." },
      { title: "Edição em sistemas incompatíveis", description: "Crie uma cópia que possa ser aberta em programas e computadores sem suporte nativo ao formato da Apple." },
      { title: "Compartilhamento", description: "Envie uma versão mais reconhecida para contatos que não conseguem visualizar a foto original." },
      { title: "Publicação na web", description: "Converta a imagem antes de incluí-la em um gerenciador de conteúdo que não processa HEIC." },
    ],
    steps: [
      "Selecione um arquivo com extensão HEIC ou HEIF de até 20 MB.",
      "Confirme o nome e o tamanho; a ausência de prévia inicial é normal nesse formato.",
      "Inicie a conversão e aguarde a decodificação local.",
      "Confira a imagem resultante e baixe a cópia em JPG.",
    ],
    specifications: [
      { label: "Entrada", value: "Arquivos HEIC ou HEIF com até 20 MB." },
      { label: "Saída", value: "Imagem JPG compatível com aplicações comuns." },
      { label: "Prévia", value: "Disponível depois da conversão, pois muitos navegadores não exibem HEIC diretamente." },
      { label: "Original", value: "Não é modificado nem substituído pela ferramenta." },
    ],
    privacy: "A decodificação usa recursos carregados no navegador e ocorre no dispositivo. A fotografia não precisa ser transferida ao Kivai. Arquivos grandes podem consumir memória significativa durante a conversão, especialmente em celulares.",
    limitations: [
      "Recursos específicos do contêiner HEIC, como sequências, profundidade ou Live Photos, não são reproduzidos no JPG.",
      "Metadados EXIF e localização podem não ser preservados na cópia resultante.",
      "JPG não suporta transparência e pode introduzir artefatos de compressão.",
      "O suporte à decodificação pode variar conforme navegador, memória e características do arquivo de origem.",
    ],
    faqs: [
      { question: "Por que não vejo a prévia do HEIC antes de converter?", answer: "Muitos navegadores não exibem HEIC nativamente. A ferramenta precisa decodificar o arquivo para então apresentar a versão em JPG." },
      { question: "A foto original será apagada?", answer: "Não. A ferramenta cria uma nova cópia; o arquivo HEIC ou HEIF selecionado permanece no dispositivo." },
      { question: "Live Photos são mantidas?", answer: "Não. A saída é uma imagem JPG estática e não inclui o trecho de vídeo ou outros recursos associados a uma Live Photo." },
      { question: "Posso converter no celular?", answer: "Sim, desde que o navegador tenha memória suficiente. Para arquivos próximos ao limite, um computador pode oferecer mais estabilidade." },
      { question: "O arquivo é enviado para conversão?", answer: "Não. A decodificação e a geração do JPG acontecem localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
      { href: "/ferramentas/compressor-de-imagens", label: "Comprimir imagens" },
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
    ],
  },
  "redimensionar-imagem": {
    overview: [
      "Redimensionar uma imagem altera a quantidade de pixels de largura e altura. A ferramenta permite informar dimensões próprias, manter a proporção original e exportar em PNG, JPG ou WebP, sendo útil para adequar fotografias e artes aos limites de sites, documentos e redes sociais.",
      "Ao reduzir, vários pixels são combinados e o arquivo geralmente fica mais leve. Ao ampliar, o navegador precisa estimar pixels novos, sem criar detalhes que não estavam no original. Por isso, ampliações muito grandes podem produzir suavização ou serrilhado mesmo quando a qualidade de exportação está alta.",
      "A opção “Não ampliar imagens menores” impede que uma imagem seja aumentada além das dimensões originais. Quando ativada, o tamanho original funciona como limite máximo, ajudando a evitar perda de nitidez causada pela ampliação de pixels.",
    ],
    useCases: [
      { title: "Publicação em plataformas", description: "Ajuste largura e altura exigidas por um formulário, marketplace, perfil ou gerenciador de conteúdo." },
      { title: "Imagens responsivas", description: "Crie versões menores para evitar que uma página transfira uma fotografia muito maior que o espaço exibido." },
      { title: "Documentos e apresentações", description: "Prepare imagens com dimensões adequadas antes de inseri-las em arquivos que serão compartilhados." },
      { title: "Padronização", description: "Deixe fotografias de produtos ou integrantes com medidas consistentes em um catálogo." },
    ],
    steps: [
      "Selecione um arquivo PNG, JPG ou WebP de até 20 MB.",
      "Informe a nova largura ou altura e decida se a proporção deve permanecer vinculada.",
      "Escolha o formato de saída e ajuste a qualidade quando disponível.",
      "Gere a nova imagem, confira as dimensões e faça o download.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG ou WebP com até 20 MB." },
      { label: "Saída", value: "PNG, JPG ou WebP nas dimensões configuradas." },
      { label: "Proporção", value: "Pode ser preservada para evitar alongamento e achatamento." },
      { label: "Qualidade", value: "Ajustável nas saídas que utilizam compressão com perdas." },
    ],
    privacy: "A imagem é decodificada, redesenhada e exportada pelo navegador. Não é necessário enviá-la para um servidor. O consumo de memória cresce com a quantidade de pixels, de modo que fotografias muito grandes podem exigir um dispositivo com mais recursos.",
    limitations: [
      "Aumentar dimensões não recupera foco, textura ou resolução ausentes no original.",
      "Desativar a proporção pode deformar pessoas, objetos, círculos e textos.",
      "Dimensões extremas podem exceder o limite de canvas do navegador.",
      "Sempre preserve o original quando a imagem também for usada para impressão ou arquivo de alta resolução.",
    ],
    faqs: [
      { question: "Qual a diferença entre redimensionar e comprimir?", answer: "Redimensionar muda largura e altura em pixels. Comprimir procura reduzir o peso do arquivo e pode manter as dimensões." },
      { question: "Como evitar uma imagem distorcida?", answer: "Mantenha a proporção ativada e altere apenas uma das dimensões; a outra será calculada com base no formato original." },
      { question: "É possível aumentar uma imagem pequena?", answer: "Sim, mas a ferramenta interpola pixels. O arquivo fica maior em dimensões sem ganhar detalhes reais." },
      { question: "Qual formato devo baixar?", answer: "Use PNG para transparência e gráficos, JPG para fotografias amplamente compatíveis e WebP para uso em ambientes modernos." },
      { question: "O processamento acontece no dispositivo?", answer: "Sim. A imagem não precisa ser enviada ao Kivai para ser redimensionada." },
    ],
    related: [
      { href: "/ferramentas/recortar-imagem", label: "Recortar imagem" },
      { href: "/ferramentas/compressor-de-imagens", label: "Comprimir imagens" },
      { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
    ],
  },
  "gerador-de-qr-code": {
    overview: [
      "O Gerador de QR Code transforma links, textos, dados de contato e configurações de Wi-Fi em um código que pode ser lido pela câmera de celulares e aplicativos compatíveis. A ferramenta cria QR Codes para URL, texto, WhatsApp, telefone, e-mail e redes Wi-Fi, com pré-visualização automática e download em PNG ou SVG.",
      "Nos formatos Telefone e WhatsApp, basta informar o DDD e o número brasileiro. O código do país +55 é incorporado automaticamente no destino, reduzindo erros de configuração em ligações e conversas. Números fixos com 10 dígitos e celulares com 11 dígitos são aceitos.",
      "Depois da geração, é possível escolher entre os modelos E-commerce, Loja física, Cartão de visita, WhatsApp e Minimalista. Cada modelo combina cor, tamanho, margem e correção de erro para uma finalidade, mas todas as configurações continuam disponíveis para ajuste manual.",
      "Um QR Code estático registra exatamente o conteúdo informado e não permite trocar o destino depois do download. Antes de publicar ou imprimir, é importante revisar os dados, manter bom contraste entre o código e o fundo e testar a leitura com mais de um celular.",
    ],
    useCases: [
      { title: "E-commerce e embalagens", description: "Direcione clientes para produtos, pedidos, páginas de suporte, avaliações ou atendimento pelo WhatsApp." },
      { title: "Lojas e materiais impressos", description: "Use em balcões, vitrines, cartazes, cardápios e etiquetas com configurações de maior contraste e resistência de leitura." },
      { title: "Contato profissional", description: "Crie atalhos para ligação, conversa no WhatsApp ou e-mail em cartões de visita, portfólios e apresentações." },
      { title: "Acesso a redes e informações", description: "Facilite a conexão de convidados ao Wi-Fi ou compartilhe textos e instruções sem exigir a digitação manual." },
    ],
    steps: [
      "Escolha entre URL, texto, WhatsApp, telefone, e-mail ou Wi-Fi.",
      "Preencha os dados solicitados. Para telefone e WhatsApp, informe somente DDD e número; o +55 será acrescentado automaticamente.",
      "Confira o QR Code gerado na pré-visualização.",
      "Escolha um dos cinco modelos sugeridos ou ajuste cor, fundo, tamanho, margem e correção de erro manualmente.",
      "Teste a leitura com a câmera do celular e baixe o resultado em PNG ou SVG.",
    ],
    specifications: [
      { label: "Conteúdos", value: "URL, texto, WhatsApp, telefone, e-mail e configuração de Wi-Fi." },
      { label: "Telefones brasileiros", value: "DDD e número com 10 ou 11 dígitos; +55 incorporado automaticamente para ligação e WhatsApp." },
      { label: "Modelos", value: "E-commerce, Loja física, Cartão de visita, WhatsApp e Minimalista." },
      { label: "Personalização", value: "Cor do código, cor de fundo, tamanho de 200 a 1.000 px, margem e quatro níveis de correção de erro." },
      { label: "Saídas", value: "PNG para uso cotidiano e SVG vetorial para impressão ou redimensionamento." },
      { label: "Prévia", value: "Atualização automática conforme o conteúdo e as configurações escolhidas." },
    ],
    privacy: "A geração acontece no navegador e os dados digitados não precisam ser enviados ao Kivai para criar a imagem. O QR Code, porém, torna o conteúdo acessível a qualquer pessoa que consiga escaneá-lo. Evite publicar senhas de Wi-Fi, mensagens privadas ou dados pessoais em materiais expostos ao público.",
    limitations: [
      "A inclusão automática do +55 nos formatos Telefone e WhatsApp é destinada a números brasileiros com DDD.",
      "O QR Code é estático; alterar um link, telefone, mensagem ou senha exige gerar e substituir o código.",
      "Cores com pouco contraste, margem insuficiente, deformação ou impressão muito pequena podem impedir a leitura.",
      "A ferramenta não confirma se URLs, e-mails, telefones, redes ou senhas informados existem ou estão corretos.",
      "Logotipos não são inseridos dentro do QR Code, pois podem reduzir a confiabilidade da leitura sem tratamento específico.",
    ],
    faqs: [
      { question: "Preciso digitar +55 no telefone ou WhatsApp?", answer: "Não. Informe somente o DDD e o número brasileiro. A ferramenta acrescenta o código 55 automaticamente no destino do QR Code." },
      { question: "Telefone fixo também funciona?", answer: "Sim. A ferramenta aceita números brasileiros com 10 dígitos, usados normalmente em telefones fixos, e com 11 dígitos, comuns em celulares." },
      { question: "O que os modelos sugeridos alteram?", answer: "Eles aplicam combinações prontas de cor, fundo, tamanho, margem e correção de erro. Depois da escolha, qualquer configuração pode ser modificada manualmente." },
      { question: "O QR Code expira?", answer: "O código estático não possui prazo próprio. Ele deixa de funcionar como esperado se o destino for removido, alterado ou ficar indisponível." },
      { question: "PNG ou SVG: qual escolher?", answer: "PNG é prático para redes sociais, documentos e telas. SVG mantém a nitidez ao ampliar e é mais indicado para impressão e edição vetorial." },
      { question: "Posso mudar o conteúdo depois de baixar?", answer: "Não. Para trocar link, telefone, mensagem, e-mail ou dados da rede, crie um novo QR Code e substitua o anterior." },
      { question: "É seguro colocar senha de Wi-Fi?", answer: "Qualquer pessoa que escanear o QR Code poderá recuperar os dados da rede. Use essa opção somente em ambientes e materiais controlados." },
      { question: "Os dados informados são enviados ao servidor?", answer: "Não. A criação da imagem acontece localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/gerador-de-favicon", label: "Gerar favicon" },
      { href: "/ferramentas/gerador-de-placeholder", label: "Gerar placeholder" },
      { href: "/ferramentas/conversor-svg-png", label: "Converter SVG e PNG" },
    ],
  },
  "gerador-de-favicon": {
    overview: [
      "O Gerador de Favicon cria um conjunto de ícones quadrados para identificar um site em abas, favoritos, atalhos e telas iniciais. A partir de uma imagem PNG, JPG ou WebP, a ferramenta produz tamanhos comuns, um arquivo favicon.ico e um pacote ZIP para organizar a implementação.",
      "Como favicons são exibidos em dimensões muito pequenas, detalhes finos e textos longos geralmente desaparecem. Marcas simples, com contraste e espaço ao redor do símbolo, permanecem mais reconhecíveis. A prévia em diferentes tamanhos ajuda a avaliar se a imagem continua legível.",
    ],
    useCases: [
      { title: "Sites novos", description: "Prepare os arquivos básicos antes de publicar um projeto ou configurar seu framework." },
      { title: "Atualização de marca", description: "Substitua ícones antigos por uma identidade visual coerente com o logotipo atual." },
      { title: "Atalhos móveis", description: "Gere versões maiores destinadas a telas iniciais e ambientes Android ou Apple." },
      { title: "Entrega para desenvolvimento", description: "Reúna nomes e dimensões previsíveis em um ZIP que possa ser incorporado ao repositório." },
    ],
    steps: [
      "Selecione uma imagem quadrada ou com espaço suficiente para o recorte.",
      "Gere as versões nos tamanhos oferecidos pela ferramenta.",
      "Confira as prévias pequenas para avaliar contraste e reconhecimento.",
      "Baixe o favicon.ico ou o ZIP e referencie os arquivos no site.",
    ],
    specifications: [
      { label: "Entrada", value: "Imagem PNG, JPG ou WebP." },
      { label: "Saídas", value: "favicon.ico e arquivos PNG em tamanhos para navegador, Apple e Android." },
      { label: "Pacote", value: "Download individual ou conjunto organizado em ZIP." },
      { label: "Formato recomendado", value: "Símbolo quadrado, simples, contrastante e sem texto pequeno." },
    ],
    privacy: "A imagem é redimensionada e empacotada no navegador. O logotipo não precisa ser enviado para geração externa. As prévias utilizam endereços temporários locais, criados apenas para permitir visualização e download durante a sessão.",
    limitations: [
      "A ferramenta gera os arquivos, mas não altera automaticamente o código ou o manifesto do site.",
      "Imagens retangulares podem ganhar espaços ou ficar difíceis de reconhecer em áreas quadradas.",
      "Textos e traços muito finos perdem legibilidade em 16×16 ou 32×32 pixels.",
      "Navegadores podem manter o favicon antigo em cache mesmo depois da substituição.",
    ],
    faqs: [
      { question: "Qual imagem funciona melhor como favicon?", answer: "Use um símbolo simples, centralizado, com contraste e proporção próxima de um quadrado. Evite frases e detalhes delicados." },
      { question: "Para que serve o favicon.ico?", answer: "É um formato tradicional reconhecido por navegadores e integrações antigas. Os PNGs complementam o conjunto em contextos modernos." },
      { question: "Por que são gerados vários tamanhos?", answer: "Abas, favoritos, atalhos e telas iniciais solicitam dimensões diferentes. Oferecer arquivos adequados reduz redimensionamentos improvisados." },
      { question: "O ícone muda no site automaticamente?", answer: "Não. Depois do download, os arquivos precisam ser publicados e referenciados no HTML ou na configuração da aplicação." },
      { question: "A marca enviada fica armazenada?", answer: "Não durante o processamento normal. A geração acontece localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/conversor-svg-png", label: "Converter SVG e PNG" },
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
    ],
  },
  "adicionar-marca-dagua": {
    overview: [
      "Adicionar Marca d'Água insere um texto ou logotipo sobre uma imagem. É possível ajustar opacidade, tamanho e posição antes de gerar a cópia final em PNG. O recurso ajuda a identificar autoria, origem ou finalidade de uma fotografia sem modificar o arquivo original.",
      "Uma marca visível funciona como aviso e elemento de identidade, mas não impede que alguém faça capturas, cortes ou edições. Para preservar a leitura da imagem, escolha uma posição que não cubra o assunto principal e uma opacidade compatível com o contraste do fundo.",
    ],
    useCases: [
      { title: "Prévia para aprovação", description: "Marque imagens como rascunho ou amostra antes de entregar o arquivo definitivo." },
      { title: "Identificação de autoria", description: "Inclua nome, endereço do site ou logotipo em fotografias publicadas." },
      { title: "Catálogos internos", description: "Aplique informações de origem ou uso em imagens distribuídas entre equipes." },
      { title: "Campanhas", description: "Adicione uma marca consistente a peças que serão compartilhadas em diferentes canais." },
    ],
    steps: [
      "Selecione a imagem principal em PNG, JPG ou WebP.",
      "Escolha marca de texto ou envie uma imagem de logotipo.",
      "Arraste a marca sobre a prévia e use a alça para redimensioná-la.",
      "Ajuste a opacidade, confira a composição e baixe a cópia em PNG.",
    ],
    specifications: [
      { label: "Imagem principal", value: "PNG, JPG ou WebP compatível com o navegador." },
      { label: "Marca", value: "Texto digitado ou logotipo em PNG, JPG ou WebP." },
      { label: "Controles", value: "Posição e tamanho por manipulação direta na prévia, além do ajuste de opacidade." },
      { label: "Saída", value: "PNG com a marca incorporada visualmente aos pixels." },
    ],
    privacy: "A imagem e o logotipo são lidos localmente e combinados em um canvas no navegador. Nenhum dos arquivos precisa ser enviado ao Kivai. A ferramenta cria uma nova cópia e não altera o original armazenado no dispositivo.",
    limitations: [
      "Uma marca d'água visível desencoraja reutilização, mas não oferece proteção técnica absoluta.",
      "Marcas pequenas ou transparentes demais podem desaparecer depois de compressão ou redimensionamento.",
      "Marcas muito grandes podem prejudicar a leitura e a finalidade principal da fotografia.",
      "Use somente logotipos e imagens para os quais você possui autorização de uso.",
    ],
    faqs: [
      { question: "A marca d'água pode ser removida?", answer: "Como ela é incorporada visualmente, sua remoção pode exigir edição, mas não é impossível. Guarde sempre os originais em local seguro." },
      { question: "Posso usar meu logotipo?", answer: "Sim. Selecione o modo de logotipo e envie uma imagem PNG, JPG ou WebP, preferencialmente com boa resolução." },
      { question: "O arquivo original é modificado?", answer: "Não. A ferramenta cria e baixa uma nova imagem em PNG." },
      { question: "Qual opacidade é melhor?", answer: "Depende do fundo e da finalidade. Procure um nível legível sem ocultar o conteúdo mais importante." },
      { question: "As imagens são enviadas ao servidor?", answer: "Não. A composição acontece localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/espelhar-e-girar-imagem", label: "Espelhar e girar" },
      { href: "/ferramentas/recortar-imagem", label: "Recortar imagem" },
      { href: "/ferramentas/compressor-de-imagens", label: "Comprimir imagem" },
    ],
  },
  "conversor-svg-png": {
    overview: [
      "O Conversor SVG e PNG trabalha em duas direções. Ao receber um SVG, ele renderiza o desenho vetorial em PNG com a largura escolhida. Ao receber PNG, JPG ou WebP, cria um documento SVG que incorpora a imagem rasterizada em seu tamanho original.",
      "É importante distinguir incorporação de vetorização: transformar uma fotografia em um arquivo SVG nesta ferramenta não converte seus contornos em curvas editáveis. O resultado continua contendo pixels, apenas embalados em uma estrutura SVG. Já a conversão de SVG para PNG produz uma captura rasterizada adequada a sistemas que não aceitam vetores.",
    ],
    useCases: [
      { title: "Compatibilidade", description: "Crie PNG quando uma plataforma, documento ou editor não aceita arquivos SVG." },
      { title: "Prévia em tamanho definido", description: "Renderize um ícone vetorial na largura necessária para uma interface ou material." },
      { title: "Encapsulamento", description: "Coloque uma imagem raster dentro de um documento SVG para fluxos que exigem essa extensão." },
      { title: "Preparação de ativos", description: "Gere uma cópia raster para revisão sem alterar o arquivo vetorial original." },
    ],
    steps: [
      "Selecione um arquivo SVG, PNG, JPG ou WebP.",
      "A ferramenta identifica automaticamente a direção da conversão.",
      "Para SVG de entrada, informe uma largura entre 16 e 4096 pixels.",
      "Converta e baixe o PNG renderizado ou o SVG com a imagem incorporada.",
    ],
    specifications: [
      { label: "SVG para PNG", value: "Renderização raster com largura configurável e altura proporcional." },
      { label: "Imagem para SVG", value: "PNG, JPG ou WebP incorporado como Data URL, sem vetorização automática." },
      { label: "Largura", value: "De 16 a 4096 pixels na saída PNG." },
      { label: "Processamento", value: "Leitura, desenho e geração realizados no navegador." },
    ],
    privacy: "O conteúdo selecionado é interpretado no navegador e a saída é construída localmente. O arquivo não precisa ser enviado ao Kivai. Como SVG pode conter estruturas complexas, utilize arquivos provenientes de fontes confiáveis e revise o resultado antes de publicá-lo.",
    limitations: [
      "Converter uma fotografia para SVG não cria vetores editáveis nem reduz necessariamente o tamanho.",
      "Fontes, filtros e recursos externos referenciados pelo SVG podem não renderizar como no programa de origem.",
      "A saída PNG perde a possibilidade de ampliar indefinidamente sem pixelização.",
      "SVGs muito complexos podem exigir mais memória ou falhar em navegadores com suporte limitado.",
    ],
    faqs: [
      { question: "A ferramenta vetoriza PNG ou JPG?", answer: "Não. Ela incorpora a imagem rasterizada dentro de um documento SVG. Os pixels não são convertidos em formas vetoriais." },
      { question: "Por que escolher a largura do PNG?", answer: "SVG não possui uma única resolução fixa. A largura define quantos pixels serão usados na renderização final." },
      { question: "A transparência do SVG é preservada?", answer: "Em condições normais, áreas transparentes permanecem transparentes no PNG, desde que os recursos do SVG sejam suportados." },
      { question: "Posso usar o PNG em impressão?", answer: "Pode, mas escolha dimensões compatíveis com o tamanho e a resolução exigidos pelo fornecedor." },
      { question: "O arquivo é processado localmente?", answer: "Sim. A conversão acontece no navegador." },
    ],
    related: [
      { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
      { href: "/ferramentas/gerador-de-favicon", label: "Gerar favicon" },
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
    ],
  },
  "espelhar-e-girar-imagem": {
    overview: [
      "Espelhar e Girar Imagem corrige orientação e inverte o conteúdo horizontal ou verticalmente. As rotações de 90, 180 e 270 graus reposicionam toda a área, enquanto o espelhamento cria uma versão refletida sem alterar o arquivo original.",
      "A inversão horizontal é comum em composições e fotografias feitas com câmera frontal, mas textos, placas, logotipos e símbolos também serão invertidos. A ferramenta apresenta uma prévia para que esses detalhes sejam conferidos antes de baixar o PNG transformado.",
    ],
    useCases: [
      { title: "Correção de orientação", description: "Ajuste imagens que foram abertas de lado ou de cabeça para baixo." },
      { title: "Composição visual", description: "Mude a direção para a qual uma pessoa ou objeto aponta dentro de um layout." },
      { title: "Câmera frontal", description: "Gere uma versão refletida ou corrija uma selfie de acordo com a finalidade." },
      { title: "Variações criativas", description: "Produza simetrias e alternativas para padrões, colagens e peças gráficas." },
    ],
    steps: [
      "Selecione uma imagem PNG, JPG ou WebP.",
      "Escolha a rotação de 0, 90, 180 ou 270 graus.",
      "Ative, se necessário, o espelhamento horizontal e/ou vertical.",
      "Aplique a transformação, revise a prévia e baixe o PNG.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG e WebP aceitos pelo navegador." },
      { label: "Rotações", value: "0°, 90°, 180° e 270°." },
      { label: "Espelhamento", value: "Horizontal, vertical ou combinação dos dois eixos." },
      { label: "Saída", value: "Imagem PNG com a transformação aplicada." },
    ],
    privacy: "A imagem é carregada e redesenhada no canvas do navegador. Não há necessidade de upload para um serviço externo. O resultado temporário permanece associado à sessão até ser substituído, baixado ou a página ser fechada.",
    limitations: [
      "Espelhar uma fotografia também inverte qualquer texto ou marca nela presente.",
      "A ferramenta transforma toda a imagem; ela não seleciona objetos isolados.",
      "Metadados de orientação e câmera podem não ser preservados na nova cópia.",
      "O resultado é PNG, o que pode gerar arquivo maior que um JPG fotográfico equivalente.",
    ],
    faqs: [
      { question: "Girar reduz a qualidade?", answer: "A operação usa o canvas para criar uma nova cópia. Em rotações de 90 graus, a geometria é preservada, mas a codificação e os metadados podem mudar." },
      { question: "Qual a diferença entre girar e espelhar?", answer: "Girar muda a orientação; espelhar inverte o conteúdo como um reflexo em um eixo." },
      { question: "Posso corrigir uma selfie invertida?", answer: "Sim. Use o espelhamento horizontal e confira se textos e logotipos ficaram na direção desejada." },
      { question: "O original é substituído?", answer: "Não. A ferramenta gera uma nova imagem para download." },
      { question: "A transformação é feita no navegador?", answer: "Sim. O arquivo não precisa ser enviado ao servidor." },
    ],
    related: [
      { href: "/ferramentas/recortar-imagem", label: "Recortar imagem" },
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
      { href: "/ferramentas/adicionar-marca-dagua", label: "Adicionar marca d'água" },
    ],
  },
  "gerador-de-placeholder": {
    overview: [
      "O Gerador de Placeholder LQIP cria uma versão minúscula e leve de uma imagem para ser exibida enquanto o arquivo principal carrega. Ele também fornece um Data URL, que pode ser incorporado diretamente ao código sem uma requisição separada para a prévia.",
      "LQIP significa low-quality image placeholder. A miniatura é propositalmente pequena e comprimida: ela antecipa cores e composição, mas não deve substituir a imagem final. Em uma implementação correta, o placeholder aparece rapidamente, ocupa a mesma área e é trocado pela versão de qualidade quando o carregamento termina.",
    ],
    useCases: [
      { title: "Sites e aplicações", description: "Evite áreas vazias enquanto fotografias maiores são carregadas em conexões lentas." },
      { title: "Galerias", description: "Crie uma percepção imediata de cor e organização antes que todas as imagens estejam disponíveis." },
      { title: "Protótipos de desempenho", description: "Teste estratégias de carregamento progressivo sem preparar miniaturas manualmente." },
      { title: "Componentes reutilizáveis", description: "Copie o Data URL para propriedades de blur ou fundos temporários em frameworks compatíveis." },
    ],
    steps: [
      "Selecione uma imagem PNG, JPG ou WebP.",
      "Defina uma largura pequena entre 8 e 128 pixels.",
      "Ajuste a qualidade do JPEG entre 10% e 90%.",
      "Gere, baixe o placeholder ou copie o Data URL para sua implementação.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG ou WebP." },
      { label: "Saída", value: "JPEG leve e Data URL equivalente." },
      { label: "Largura", value: "De 8 a 128 pixels, com altura proporcional." },
      { label: "Qualidade", value: "De 10% a 90%; valores baixos priorizam tamanho reduzido." },
    ],
    privacy: "A miniatura e o Data URL são gerados inteiramente no navegador. A imagem não precisa ser enviada ao Kivai. Ao copiar um Data URL, lembre-se de que todo o conteúdo visual fica codificado no próprio texto copiado.",
    limitations: [
      "O placeholder não substitui técnicas de dimensionamento, cache e carregamento responsivo da imagem final.",
      "Data URLs grandes aumentam o HTML ou CSS e podem prejudicar o desempenho que se pretende melhorar.",
      "O JPEG gerado não preserva transparência.",
      "A implementação da troca entre placeholder e imagem final deve ser feita no site de destino.",
    ],
    faqs: [
      { question: "O que é um Data URL?", answer: "É uma representação textual do arquivo que pode ser usada diretamente em atributos e estilos, sem criar um endereço separado para a miniatura." },
      { question: "Qual largura devo usar?", answer: "Comece entre 24 e 48 pixels. A melhor escolha depende do tamanho visual, do nível de desfoque e do peso aceitável." },
      { question: "Por que o resultado fica borrado?", answer: "Isso é intencional. O placeholder precisa ser pequeno e leve; a imagem final é responsável pelos detalhes." },
      { question: "Posso usar o JPEG gerado como imagem final?", answer: "Não é recomendado, pois ele tem baixa resolução e foi criado apenas para o estado temporário de carregamento." },
      { question: "A imagem é enviada para algum serviço?", answer: "Não. A geração acontece localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/compressor-de-imagens", label: "Comprimir imagens" },
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
      { href: "/ferramentas/conversor-de-imagens", label: "Converter imagens" },
    ],
  },
  "recortar-imagem": {
    overview: [
      "Recortar Imagem mantém uma região retangular e remove visualmente o que está fora dela. A área é definida por coordenadas X e Y, largura e altura em pixels, oferecendo controle numérico para enquadramentos precisos sem alterar o arquivo de origem.",
      "O ponto X é medido a partir da borda esquerda e Y a partir do topo. Largura e altura determinam o tamanho da região preservada. A ferramenta limita valores que ultrapassariam a imagem e gera uma nova cópia PNG somente com a área selecionada.",
    ],
    useCases: [
      { title: "Ajuste de enquadramento", description: "Remova bordas e elementos laterais para destacar o assunto principal." },
      { title: "Capturas de tela", description: "Isole uma mensagem, gráfico ou componente antes de inserir a imagem em uma documentação." },
      { title: "Catálogos", description: "Padronize regiões visíveis de fotografias antes de redimensioná-las para uma vitrine." },
      { title: "Preparação para outras ferramentas", description: "Recorte primeiro para depois comprimir, adicionar marca ou converter o formato." },
    ],
    steps: [
      "Selecione uma imagem PNG, JPG ou WebP.",
      "Informe X e Y para posicionar o canto superior esquerdo da área.",
      "Defina largura e altura, respeitando as dimensões do arquivo original.",
      "Recorte, confira o resultado e baixe a nova imagem em PNG.",
    ],
    specifications: [
      { label: "Entrada", value: "PNG, JPG ou WebP." },
      { label: "Coordenadas", value: "X e Y medidos em pixels a partir do canto superior esquerdo." },
      { label: "Dimensões", value: "Largura e altura limitadas à área restante da imagem." },
      { label: "Saída", value: "PNG contendo apenas a região selecionada." },
    ],
    privacy: "O arquivo é aberto e recortado no navegador com canvas. Ele não precisa ser enviado ao Kivai. O resultado é uma nova cópia temporária e só será armazenado no dispositivo se o usuário acionar o download.",
    limitations: [
      "O recorte atual é retangular e controlado por números; não há seleção livre ou detecção automática de objeto.",
      "Conteúdo removido não pode ser recuperado a partir da cópia recortada, portanto preserve o original.",
      "O recorte não amplia detalhes nem corrige foco, perspectiva ou iluminação.",
      "A saída em PNG pode ser maior que o JPG original dependendo das dimensões e do conteúdo.",
    ],
    faqs: [
      { question: "O que significam X e Y?", answer: "X indica a distância da borda esquerda e Y a distância do topo até o início da região que será mantida." },
      { question: "Posso recortar fora dos limites?", answer: "A ferramenta ajusta os valores para que a área permaneça dentro das dimensões disponíveis na imagem." },
      { question: "O arquivo original é alterado?", answer: "Não. O recorte gera uma nova cópia em PNG." },
      { question: "É possível recortar em círculo?", answer: "Não nesta versão. A área de saída é retangular." },
      { question: "A operação é realizada localmente?", answer: "Sim. A imagem é processada no navegador." },
    ],
    related: [
      { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar imagem" },
      { href: "/ferramentas/espelhar-e-girar-imagem", label: "Espelhar e girar" },
      { href: "/ferramentas/adicionar-marca-dagua", label: "Adicionar marca d'água" },
    ],
  },
} satisfies Record<ImageToolEditorialSlug, ImageToolEditorialContent>;
