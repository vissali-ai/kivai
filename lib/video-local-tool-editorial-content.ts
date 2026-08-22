export type VideoLocalToolEditorialSlug =
  | "ajustar-velocidade-video"
  | "alterar-volume-video"
  | "redimensionar-video"
  | "dividir-video"
  | "video-para-audio"
  | "girar-video"
  | "espelhar-video"
  | "remover-audio-video"
  | "recortar-video"
  | "capturar-frame-video";

export type VideoLocalEditorialContent = {
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

const related = [
  { href: "/ferramentas/ajustar-velocidade-video", label: "Ajustar Velocidade" },
  { href: "/ferramentas/alterar-volume-video", label: "Alterar Volume" },
  { href: "/ferramentas/redimensionar-video", label: "Redimensionar Vídeo" },
  { href: "/ferramentas/dividir-video", label: "Dividir Vídeo" },
  { href: "/ferramentas/video-para-audio", label: "Vídeo para Áudio" },
  { href: "/ferramentas/girar-video", label: "Girar Vídeo" },
  { href: "/ferramentas/espelhar-video", label: "Espelhar Vídeo" },
  { href: "/ferramentas/remover-audio-video", label: "Remover Áudio" },
  { href: "/ferramentas/recortar-video", label: "Recortar Vídeo" },
  { href: "/ferramentas/capturar-frame-video", label: "Capturar Frame" },
];

const localPrivacy =
  "O arquivo é processado localmente no navegador. O vídeo não é enviado ao Kivai durante esta operação. O resultado é gerado no dispositivo, e a compatibilidade depende das APIs, codecs e recursos disponíveis no navegador usado.";

function withRelated(
  slug: VideoLocalToolEditorialSlug,
  input: Omit<VideoLocalEditorialContent, "related">,
): VideoLocalEditorialContent {
  return {
    ...input,
    related: related.filter((item) => item.href !== `/ferramentas/${slug}`),
  };
}

export const videoLocalToolEditorialContent: Record<VideoLocalToolEditorialSlug, VideoLocalEditorialContent> = {
  "ajustar-velocidade-video": withRelated("ajustar-velocidade-video", {
    overview: [
      "A ferramenta permite acelerar ou desacelerar um vídeo entre 0,25× e 4×. A duração estimada muda de acordo com a velocidade escolhida, permitindo preparar câmera rápida, desaceleração ou versões mais curtas de uma gravação.",
      "A reprodução é recodificada no próprio navegador para gerar um novo arquivo. Quando o navegador oferece suporte à captura da faixa de áudio, o som acompanha a nova velocidade durante a exportação.",
    ],
    useCases: [
      { title: "Acelerar conteúdos longos", description: "Reduza a duração de tutoriais, aulas ou gravações extensas." },
      { title: "Criar câmera rápida", description: "Aumente a velocidade para destacar passagem de tempo ou processos." },
      { title: "Observar detalhes", description: "Desacelere uma cena para analisar movimentos ou etapas específicas." },
    ],
    steps: ["Selecione um vídeo compatível.", "Aguarde a leitura da duração e da prévia.", "Escolha uma velocidade entre 0,25× e 4×.", "Confira a duração estimada.", "Processe, reproduza o resultado e faça o download."],
    specifications: [
      { label: "Velocidades", value: "De 0,25× a 4×, incluindo controles predefinidos." },
      { label: "Duração", value: "A duração estimada é a duração original dividida pela velocidade escolhida." },
      { label: "Saída", value: "Vídeo WebM recodificado no ritmo selecionado, quando suportado pelo navegador." },
      { label: "Áudio", value: "Mantido e sincronizado somente quando a captura da faixa for compatível." },
    ],
    privacy: localPrivacy,
    limitations: ["Velocidades extremas podem reduzir a naturalidade do áudio e do movimento.", "A exportação ocorre durante a reprodução e pode demorar em vídeos longos.", "Codecs e captura de áudio dependem do navegador e do dispositivo."],
    faqs: [
      { question: "Qual velocidade posso escolher?", answer: "A ferramenta oferece velocidades entre 0,25× e 4×." },
      { question: "O vídeo é enviado para um servidor?", answer: "Não nesta ferramenta. O processamento acontece localmente no navegador." },
      { question: "O áudio acompanha a nova velocidade?", answer: "Quando o navegador oferece suporte à captura da faixa, o áudio acompanha a exportação; em casos incompatíveis, ele pode não ser preservado." },
      { question: "A duração final muda?", answer: "Sim. A duração é aproximadamente a duração original dividida pelo multiplicador de velocidade escolhido." },
    ],
  }),
  "alterar-volume-video": withRelated("alterar-volume-video", {
    overview: [
      "O controle de volume permite reduzir ou ampliar o nível sonoro capturado de um vídeo, com ajuste de 0% a 300%. O valor de 0% cria uma versão sem som, enquanto percentuais acima de 100% aumentam a amplitude disponível.",
      "A mixagem e a recodificação são feitas localmente durante a reprodução do arquivo. A disponibilidade do áudio e a saída dependem dos codecs reconhecidos e das APIs oferecidas pelo navegador.",
    ],
    useCases: [
      { title: "Reforçar uma fala", description: "Aumente gravações em que a voz ficou baixa, observando possíveis distorções." },
      { title: "Reduzir o áudio", description: "Diminua o som antes de adicionar outra trilha em um editor." },
      { title: "Criar uma cópia silenciosa", description: "Use 0% quando precisar de uma versão sem áudio." },
    ],
    steps: ["Selecione o vídeo.", "Reproduza a prévia e confirme que o áudio está acessível.", "Escolha o volume entre 0% e 300%.", "Processe a nova versão.", "Confira o player final antes de baixar."],
    specifications: [
      { label: "Faixa de ajuste", value: "De 0% a 300% do volume capturado." },
      { label: "Entrada", value: "Vídeos que o navegador consiga reproduzir, como MP4, WebM ou MOV compatíveis." },
      { label: "Saída", value: "Novo vídeo WebM, com áudio processado quando a faixa estiver disponível." },
      { label: "Processamento", value: "Mixagem e recodificação locais durante a reprodução." },
    ],
    privacy: localPrivacy,
    limitations: ["Elevar muito o volume também amplia ruídos e pode causar distorção.", "A ferramenta não remove ruído nem normaliza loudness automaticamente.", "Codecs de áudio não reconhecidos podem impedir o processamento da faixa."],
    faqs: [
      { question: "Posso deixar o vídeo sem som?", answer: "Sim. Ajuste o volume para 0% para gerar uma cópia silenciosa." },
      { question: "Qual é o volume máximo?", answer: "O controle permite chegar a 300% do nível capturado." },
      { question: "Aumentar para 300% melhora a qualidade?", answer: "Não. O aumento também pode ampliar ruídos e causar distorção quando a gravação já está próxima do limite." },
      { question: "O vídeo é enviado ao Kivai?", answer: "Não. Esta operação é feita localmente no navegador." },
    ],
  }),
  "redimensionar-video": withRelated("redimensionar-video", {
    overview: [
      "Redimensionar altera a largura e a altura do vídeo para adaptar o arquivo a sites, apresentações e formatos de publicação. É possível preservar todo o quadro, preencher a área escolhida com recorte nas bordas ou esticar a imagem quando a distorção for intencional.",
      "A ferramenta trabalha no navegador e permite manter a proporção original ao editar uma das dimensões. Aumentar a resolução não cria detalhes que não existiam no vídeo de origem.",
    ],
    useCases: [
      { title: "Preparar formatos sociais", description: "Adapte dimensões para composições horizontais, verticais ou quadradas." },
      { title: "Reduzir resolução", description: "Diminua as dimensões antes de compartilhar ou incorporar o vídeo." },
      { title: "Ajustar a um espaço específico", description: "Crie uma saída adequada a uma área de site ou apresentação." },
    ],
    steps: ["Selecione o vídeo.", "Informe largura e altura ou use os controles disponíveis.", "Escolha Ajustar, Preencher ou Esticar.", "Confira a prévia e a proporção.", "Processe e baixe a nova versão."],
    specifications: [
      { label: "Dimensões", value: "Largura e altura entre 16 e 3840 pixels." },
      { label: "Ajustar", value: "Preserva todo o quadro e adiciona bordas quando necessário." },
      { label: "Preencher", value: "Ocupa a resolução escolhida e corta excedentes nas bordas." },
      { label: "Esticar", value: "Força o quadro a ocupar as novas dimensões, podendo alterar a proporção." },
    ],
    privacy: localPrivacy,
    limitations: ["Aumentar a resolução não recupera detalhes ausentes no original.", "O modo Preencher pode remover partes das bordas.", "Resoluções altas exigem mais memória e processamento do dispositivo."],
    faqs: [
      { question: "Redimensionar melhora a qualidade?", answer: "Não. Aumentar as dimensões não adiciona detalhes que não estavam no vídeo original." },
      { question: "Qual a diferença entre Ajustar e Preencher?", answer: "Ajustar preserva todo o quadro e pode criar bordas; Preencher ocupa toda a área e pode cortar as extremidades." },
      { question: "Posso manter a proporção original?", answer: "Sim. A interface oferece controle para preservar a proporção ao alterar largura ou altura." },
      { question: "O processamento é local?", answer: "Sim. Esta ferramenta redimensiona e recodifica o vídeo no navegador." },
    ],
  }),
  "dividir-video": withRelated("dividir-video", {
    overview: [
      "A ferramenta divide uma gravação em duas partes a partir de um ponto escolhido na linha do tempo. A primeira saída vai do início até a posição selecionada e a segunda contém o restante do vídeo.",
      "O corte é realizado durante a recodificação local para priorizar precisão visual. O tempo necessário depende principalmente da duração, resolução e capacidade do dispositivo.",
    ],
    useCases: [
      { title: "Separar introdução e conteúdo", description: "Crie duas partes em um ponto específico da gravação." },
      { title: "Aproveitar apenas um trecho", description: "Gere duas saídas e mantenha somente a parte de interesse." },
      { title: "Criar arquivos menores", description: "Divida uma gravação longa em duas versões independentes." },
    ],
    steps: ["Selecione o vídeo.", "Use a linha do tempo para escolher o ponto de divisão.", "Confirme a posição de corte.", "Inicie o processamento local.", "Revise e baixe a primeira e a segunda parte."],
    specifications: [
      { label: "Ponto de divisão", value: "Selecionado em segundos entre o início e o final do vídeo." },
      { label: "Parte 1", value: "Do início até o ponto escolhido." },
      { label: "Parte 2", value: "Do ponto escolhido até o final." },
      { label: "Saída", value: "Dois vídeos WebM recodificados localmente." },
    ],
    privacy: localPrivacy,
    limitations: ["A ferramenta cria exatamente duas partes por operação.", "O corte exige recodificação e pode alterar tamanho e compressão.", "A preservação do áudio depende do suporte de captura do navegador."],
    faqs: [
      { question: "Quantas partes são criadas?", answer: "Cada operação gera duas partes a partir de um único ponto de divisão." },
      { question: "O corte é feito sem recodificação?", answer: "Não. A ferramenta recodifica localmente para produzir as duas saídas." },
      { question: "O áudio é mantido?", answer: "Quando o navegador consegue capturar a faixa de áudio, ela pode acompanhar as duas partes." },
      { question: "O arquivo é enviado para servidor?", answer: "Não nesta ferramenta. O processamento acontece no dispositivo." },
    ],
  }),
  "video-para-audio": withRelated("video-para-audio", {
    overview: [
      "Vídeo para Áudio extrai somente a faixa sonora de um arquivo de vídeo quando o navegador consegue reproduzir e expor esse áudio para captura. É útil para entrevistas, aulas, narrações e gravações autorizadas.",
      "A saída varia conforme o navegador: Safari pode disponibilizar M4A, enquanto outros navegadores podem gerar WebM com Opus. A ferramenta não oferece conversão direta para MP3 nesta versão.",
    ],
    useCases: [
      { title: "Salvar uma narração", description: "Extraia a voz de uma aula, entrevista ou gravação autorizada." },
      { title: "Preparar edição de áudio", description: "Gere uma faixa separada para trabalhar depois em outro editor." },
      { title: "Ouvir sem o vídeo", description: "Crie uma versão somente em áudio quando a imagem não for necessária." },
    ],
    steps: ["Selecione um vídeo com faixa de áudio.", "Aguarde o navegador carregar e validar o arquivo.", "Inicie a extração.", "Aguarde a captura local da faixa.", "Reproduza e baixe o áudio gerado."],
    specifications: [
      { label: "Entrada", value: "Vídeo com faixa de áudio reconhecida pelo navegador." },
      { label: "Safari", value: "Pode gerar áudio M4A quando essa codificação estiver disponível." },
      { label: "Outros navegadores", value: "Pode gerar WebM com Opus quando compatível." },
      { label: "Qualidade", value: "Codificação local com taxa solicitada de até 192 kbps." },
    ],
    privacy: localPrivacy,
    limitations: ["Não funciona quando o vídeo não possui faixa de áudio acessível.", "Arquivos protegidos ou codecs incompatíveis podem não ser processados.", "A saída varia entre navegadores e não inclui MP3 direto."],
    faqs: [
      { question: "Posso baixar em MP3?", answer: "Não nesta versão. A saída pode ser M4A no Safari ou WebM/Opus em outros navegadores compatíveis." },
      { question: "Por que a ferramenta não encontrou áudio?", answer: "O vídeo pode não ter faixa de áudio ou o codec pode não ser exposto pelo navegador para captura." },
      { question: "O vídeo é enviado para servidor?", answer: "Não. A extração é feita localmente." },
      { question: "A qualidade depende do navegador?", answer: "Sim. O formato e o suporte de codificação variam entre navegadores e dispositivos." },
    ],
  }),
  "girar-video": withRelated("girar-video", {
    overview: [
      "Girar Vídeo corrige a orientação de gravações que aparecem de lado ou de cabeça para baixo. A ferramenta oferece rotações de 0°, 90°, 180° e 270° e permite conferir a transformação antes da exportação.",
      "O quadro é redesenhado e recodificado no próprio navegador. Em rotações de 90° ou 270°, largura e altura da saída são ajustadas à nova orientação.",
    ],
    useCases: [
      { title: "Corrigir vídeo de lado", description: "Aplique 90° ou 270° quando a orientação ficou incorreta." },
      { title: "Corrigir vídeo invertido", description: "Use 180° para gravações de cabeça para baixo." },
      { title: "Preparar para outras edições", description: "Acerte a orientação antes de recortar, redimensionar ou publicar." },
    ],
    steps: ["Selecione o vídeo.", "Escolha 90°, 180° ou 270° conforme necessário.", "Confira a prévia transformada.", "Inicie a exportação local.", "Reproduza e baixe o resultado."],
    specifications: [
      { label: "Ângulos", value: "0°, 90°, 180° ou 270°." },
      { label: "Prévia", value: "Permite conferir o quadro transformado antes de exportar." },
      { label: "Saída", value: "Vídeo WebM com dimensões ajustadas à rotação." },
      { label: "Áudio", value: "Mantido quando a captura da faixa for suportada pelo navegador." },
    ],
    privacy: localPrivacy,
    limitations: ["A operação recodifica o vídeo e pode alterar tamanho e compressão.", "Metadados de orientação do original não são usados como método de rotação na saída.", "A exportação depende de Canvas, MediaRecorder e codecs suportados."],
    faqs: [
      { question: "Quais rotações estão disponíveis?", answer: "Você pode manter 0° ou aplicar 90°, 180° e 270°." },
      { question: "A largura e a altura mudam?", answer: "Em rotações de 90° e 270°, as dimensões são ajustadas para acompanhar a nova orientação." },
      { question: "O áudio é preservado?", answer: "Quando o navegador oferece captura compatível da faixa de áudio, ela pode ser mantida." },
      { question: "O vídeo sai do meu dispositivo?", answer: "Não nesta ferramenta. A transformação é local." },
    ],
  }),
  "espelhar-video": withRelated("espelhar-video", {
    overview: [
      "Espelhar Vídeo inverte o quadro horizontalmente, verticalmente ou nas duas direções. O espelhamento horizontal produz o efeito típico de câmera frontal, enquanto o vertical troca a parte superior pela inferior.",
      "A prévia ajuda a validar a transformação antes de gerar a saída. O vídeo é redesenhado e recodificado localmente em formato compatível com o navegador.",
    ],
    useCases: [
      { title: "Corrigir câmera frontal", description: "Inverta horizontalmente uma gravação quando a orientação visual ficou espelhada." },
      { title: "Criar variação simétrica", description: "Use o espelhamento como transformação visual de uma cena." },
      { title: "Inverter verticalmente", description: "Troque topo e base quando esse efeito for necessário." },
    ],
    steps: ["Selecione o vídeo.", "Ative o espelhamento horizontal, vertical ou ambos.", "Confira a prévia.", "Processe o novo vídeo no navegador.", "Reproduza e baixe a saída."],
    specifications: [
      { label: "Horizontal", value: "Troca os lados esquerdo e direito do quadro." },
      { label: "Vertical", value: "Inverte a imagem de cima para baixo." },
      { label: "Combinação", value: "Os dois controles podem ser aplicados ao mesmo tempo." },
      { label: "Saída", value: "Novo vídeo WebM processado localmente quando suportado." },
    ],
    privacy: localPrivacy,
    limitations: ["Textos e logotipos também ficam invertidos com a imagem.", "A transformação não corrige perspectiva ou inclinação de câmera.", "O áudio depende do suporte de captura do navegador."],
    faqs: [
      { question: "Posso espelhar apenas horizontalmente?", answer: "Sim. Os controles horizontal e vertical funcionam de forma independente." },
      { question: "Posso combinar os dois sentidos?", answer: "Sim. É possível ativar horizontal e vertical ao mesmo tempo." },
      { question: "Textos dentro do vídeo também invertem?", answer: "Sim. O espelhamento transforma todo o quadro, incluindo textos e logotipos." },
      { question: "O processamento é local?", answer: "Sim. A transformação acontece no navegador." },
    ],
  }),
  "remover-audio-video": withRelated("remover-audio-video", {
    overview: [
      "Remover Áudio cria uma cópia silenciosa do vídeo, preservando a parte visual e excluindo a faixa sonora da saída. O arquivo original não é modificado.",
      "O processamento é feito localmente e gera uma nova versão do vídeo. Essa operação é útil antes de adicionar outra trilha, compartilhar uma gravação sem conversas ou preparar conteúdo para reprodução silenciosa.",
    ],
    useCases: [
      { title: "Criar vídeo silencioso", description: "Prepare materiais para telas, apresentações e publicações sem som." },
      { title: "Adicionar outra trilha depois", description: "Crie uma base visual sem o áudio original para edição posterior." },
      { title: "Remover conversas", description: "Gere uma cópia sem a faixa sonora antes de compartilhar uma gravação." },
    ],
    steps: ["Selecione o vídeo.", "Confira a prévia do arquivo original.", "Inicie a remoção do áudio.", "Aguarde a recodificação local da imagem.", "Reproduza a versão silenciosa e faça o download."],
    specifications: [
      { label: "Alteração", value: "A faixa visual é recodificada sem áudio na saída." },
      { label: "Original", value: "O arquivo selecionado permanece intacto no dispositivo." },
      { label: "Saída", value: "Vídeo WebM silencioso quando o navegador oferece suporte." },
      { label: "Privacidade", value: "O vídeo é processado localmente, sem upload ao Kivai." },
    ],
    privacy: localPrivacy,
    limitations: ["A remoção vale apenas para a cópia exportada; mantenha o original se precisar do som.", "Não é possível remover somente um trecho do áudio nesta ferramenta.", "Codecs de vídeo incompatíveis podem impedir a abertura ou exportação."],
    faqs: [
      { question: "O arquivo original perde o áudio?", answer: "Não. A ferramenta cria uma nova cópia silenciosa e não modifica o original." },
      { question: "Posso remover o áudio de apenas uma parte?", answer: "Não nesta versão. A remoção se aplica à saída inteira." },
      { question: "O vídeo é enviado para servidor?", answer: "Não. O processamento desta ferramenta acontece localmente." },
      { question: "Qual é a saída?", answer: "O resultado é um vídeo silencioso codificado em formato suportado pelo navegador, normalmente WebM." },
    ],
  }),
  "recortar-video": withRelated("recortar-video", {
    overview: [
      "Recortar Vídeo permite definir qual região do quadro será mantida na saída. Os controles de posição e tamanho trabalham sobre a área visível para remover bordas, reposicionar o foco ou adaptar o enquadramento.",
      "A prévia mostra a região escolhida antes da exportação. O recorte remove pixels das bordas e não recupera conteúdo que esteja fora do quadro original.",
    ],
    useCases: [
      { title: "Remover bordas", description: "Elimine áreas indesejadas nas extremidades do vídeo." },
      { title: "Destacar uma região", description: "Mude o enquadramento para concentrar atenção em uma parte da cena." },
      { title: "Preparar publicação", description: "Ajuste a área visível antes de usar o vídeo em outro formato." },
    ],
    steps: ["Selecione o vídeo.", "Defina posição e tamanho da área de recorte.", "Confira a região mantida na prévia.", "Inicie a recodificação local.", "Revise e baixe o vídeo recortado."],
    specifications: [
      { label: "Controles", value: "Posição e tamanho do recorte definidos em relação ao quadro original." },
      { label: "Prévia", value: "Mostra a região que permanecerá antes da exportação." },
      { label: "Saída", value: "Vídeo WebM contendo apenas a área selecionada, quando suportado." },
      { label: "Áudio", value: "Pode ser incluído quando o navegador disponibiliza a faixa para captura." },
    ],
    privacy: localPrivacy,
    limitations: ["Recortar remove pixels e não revela conteúdo fora do quadro original.", "Recortes muito pequenos reduzem a resolução final.", "A saída depende de Canvas, MediaRecorder e codecs disponíveis no navegador."],
    faqs: [
      { question: "Recortar vídeo é o mesmo que cortar a duração?", answer: "Não. Esta ferramenta recorta a área visual do quadro; ela não remove tempo do início ou do fim." },
      { question: "O recorte reduz a resolução?", answer: "Pode reduzir, porque a saída usa somente os pixels da região escolhida." },
      { question: "Posso conferir antes de exportar?", answer: "Sim. A ferramenta oferece prévia da região que será mantida." },
      { question: "O processamento é local?", answer: "Sim. O recorte é feito no navegador." },
    ],
  }),
  "capturar-frame-video": withRelated("capturar-frame-video", {
    overview: [
      "Capturar Frame transforma um quadro específico do vídeo em uma imagem estática. Você pode navegar pela linha do tempo até encontrar o momento desejado e exportar a captura em PNG, JPG ou WebP.",
      "A nitidez máxima depende da resolução do vídeo original. O processo usa o próprio navegador e não envia o vídeo nem a imagem resultante para um serviço externo.",
    ],
    useCases: [
      { title: "Criar uma capa", description: "Escolha um momento representativo para usar como thumbnail ou imagem de apoio." },
      { title: "Registrar um quadro", description: "Salve uma cena específica para documentação ou referência." },
      { title: "Evitar captura de tela", description: "Extraia diretamente o frame sem incluir controles do player ou da interface." },
    ],
    steps: ["Selecione o vídeo.", "Navegue pela linha do tempo até o momento desejado.", "Ajuste o ponto com os controles de avanço ou retrocesso.", "Escolha PNG, JPG ou WebP e a resolução disponível.", "Gere e baixe a imagem."],
    specifications: [
      { label: "Navegação", value: "Controle pela linha do tempo e avanço ou retrocesso por segundos." },
      { label: "Formatos", value: "PNG, JPG e WebP." },
      { label: "Resolução", value: "Resolução original do frame ou opções oferecidas pela interface." },
      { label: "Saída", value: "Imagem estática gerada diretamente a partir do quadro exibido." },
    ],
    privacy: localPrivacy,
    limitations: ["A nitidez é limitada pela resolução do vídeo original.", "Vídeos protegidos ou com codec incompatível podem não abrir.", "A ferramenta captura um quadro e não adiciona textos, colagens ou efeitos de design."],
    faqs: [
      { question: "Quais formatos de imagem posso baixar?", answer: "A ferramenta oferece PNG, JPG e WebP." },
      { question: "A captura mantém a resolução do vídeo?", answer: "É possível usar a resolução original do frame, limitada pela qualidade e dimensões do vídeo de origem." },
      { question: "Isso é igual a tirar um print da tela?", answer: "Não. A imagem é extraída do quadro do vídeo, sem incluir controles do player ou outros elementos da tela." },
      { question: "O vídeo é enviado para servidor?", answer: "Não. A captura do frame é feita localmente no navegador." },
    ],
  }),
};

export const videoVariantToSlug = {
  speed: "ajustar-velocidade-video",
  volume: "alterar-volume-video",
  resize: "redimensionar-video",
  split: "dividir-video",
  audio: "video-para-audio",
  rotate: "girar-video",
  mirror: "espelhar-video",
  mute: "remover-audio-video",
  crop: "recortar-video",
  thumbnail: "capturar-frame-video",
} as const;

export type VideoLocalVariant = keyof typeof videoVariantToSlug;
