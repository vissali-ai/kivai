export type VideoServerToolEditorialSlug =
  | "hevc-para-mp4"
  | "mp4-para-hevc"
  | "mp4-para-mov"
  | "mov-para-mp4"
  | "mp4-para-avi"
  | "compressor-de-videos";

export type VideoServerEditorialContent = {
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
  { href: "/ferramentas/hevc-para-mp4", label: "HEVC para MP4" },
  { href: "/ferramentas/mp4-para-hevc", label: "MP4 para HEVC" },
  { href: "/ferramentas/mp4-para-mov", label: "MP4 para MOV" },
  { href: "/ferramentas/mov-para-mp4", label: "MOV para MP4" },
  { href: "/ferramentas/mp4-para-avi", label: "MP4 para AVI" },
  { href: "/ferramentas/compressor-de-videos", label: "Compressor de Vídeos" },
  { href: "/ferramentas/video-para-audio", label: "Vídeo para Áudio" },
];

const serverPrivacy =
  "O vídeo é enviado por HTTPS ao serviço de processamento do Kivai para execução com FFmpeg. O backend trabalha com arquivos temporários e executa a limpeza ao concluir ou interromper a operação. O arquivo original permanece inalterado no seu dispositivo.";

function withRelated(
  slug: VideoServerToolEditorialSlug,
  input: Omit<VideoServerEditorialContent, "related">,
): VideoServerEditorialContent {
  return { ...input, related: related.filter((item) => item.href !== `/ferramentas/${slug}`) };
}

export const videoServerToolEditorialContent: Record<VideoServerToolEditorialSlug, VideoServerEditorialContent> = {
  "hevc-para-mp4": withRelated("hevc-para-mp4", {
    overview: [
      "O conversor HEVC para MP4 transforma vídeos codificados em HEVC/H.265 em um MP4 com vídeo H.264 e áudio AAC quando existe faixa de áudio. A finalidade é ampliar a compatibilidade com navegadores, editores, sistemas de upload e dispositivos que não reproduzem HEVC de forma nativa.",
      "A resolução original é preservada, mas existe recodificação do vídeo. Por isso, pode ocorrer pequena diferença visual conforme o perfil de qualidade selecionado e a complexidade do material.",
    ],
    useCases: [
      { title: "Compatibilidade", description: "Prepare gravações HEVC para dispositivos e programas que trabalham melhor com H.264 em MP4." },
      { title: "Edição", description: "Converta um arquivo que o editor não consegue abrir por falta de suporte ao codec H.265." },
      { title: "Publicação", description: "Gere uma cópia mais adequada a sites, plataformas e fluxos que solicitam MP4 compatível." },
    ],
    steps: ["Selecione um vídeo HEVC/H.265 compatível.", "Escolha o perfil de qualidade.", "Inicie a conversão e aguarde o processamento no servidor.", "Confira o resultado e baixe o novo MP4."],
    specifications: [
      { label: "Entrada", value: "Vídeo HEVC/H.265 compatível, até 200 MB." },
      { label: "Saída", value: "MP4 com vídeo H.264 e áudio AAC quando presente." },
      { label: "Resolução", value: "Largura e altura originais preservadas." },
      { label: "Processamento", value: "Conversão no servidor com FFmpeg." },
    ],
    privacy: serverPrivacy,
    limitations: ["A conversão recodifica o vídeo e pode alterar discretamente a qualidade visual.", "Arquivos danificados, apenas renomeados ou com codec incompatível podem ser recusados.", "O tempo de processamento depende da duração, resolução, qualidade escolhida e carga do serviço."],
    faqs: [
      { question: "HEVC e H.265 são a mesma coisa?", answer: "Sim. H.265 é a identificação técnica do padrão também conhecido como HEVC." },
      { question: "Por que converter HEVC para MP4?", answer: "Um MP4 com H.264 e AAC costuma ser aceito por uma variedade maior de navegadores, aplicativos e dispositivos." },
      { question: "A resolução será mantida?", answer: "Sim. A conversão preserva largura e altura do vídeo original." },
      { question: "O áudio é preservado?", answer: "Quando há uma faixa de áudio compatível, ela é convertida para AAC." },
      { question: "O arquivo original é alterado?", answer: "Não. Um novo MP4 é criado e o arquivo enviado permanece intacto no seu dispositivo." },
    ],
  }),
  "mp4-para-hevc": withRelated("mp4-para-hevc", {
    overview: [
      "O conversor MP4 para HEVC recodifica o vídeo de um arquivo MP4 usando HEVC/H.265. O resultado continua em um container MP4 e mantém áudio em AAC quando o original possui faixa sonora.",
      "HEVC pode oferecer compressão eficiente, mas não é universalmente compatível. O tamanho final depende do conteúdo, duração, qualidade escolhida e características do arquivo original.",
    ],
    useCases: [
      { title: "Arquivamento", description: "Prepare cópias em H.265 para bibliotecas em dispositivos e programas compatíveis." },
      { title: "Economia de espaço", description: "Busque uma codificação mais eficiente quando o destino oferece suporte a HEVC." },
      { title: "Fluxos H.265", description: "Padronize vídeos destinados a aparelhos ou processos que utilizam HEVC." },
    ],
    steps: ["Selecione o arquivo MP4.", "Escolha o perfil de qualidade.", "Inicie a conversão para HEVC.", "Baixe o MP4 codificado em H.265."],
    specifications: [
      { label: "Entrada", value: "Um arquivo MP4 por vez, até 200 MB." },
      { label: "Saída", value: "Container MP4 com vídeo HEVC/H.265 e áudio AAC quando presente." },
      { label: "Resolução", value: "Dimensões originais preservadas." },
      { label: "Processamento", value: "Recodificação no servidor com FFmpeg." },
    ],
    privacy: serverPrivacy,
    limitations: ["HEVC pode não abrir em dispositivos, navegadores ou programas antigos.", "Toda recodificação pode produzir pequena diferença visual.", "O arquivo final não é garantidamente menor que o original."],
    faqs: [
      { question: "MP4 e HEVC são a mesma coisa?", answer: "Não. MP4 é um container e HEVC é o codec usado para comprimir o vídeo dentro dele." },
      { question: "O arquivo sempre ficará menor?", answer: "Não. O tamanho depende de bitrate, conteúdo, duração e codec do arquivo original." },
      { question: "A resolução será mantida?", answer: "Sim. A largura e a altura originais são preservadas." },
      { question: "HEVC funciona em qualquer dispositivo?", answer: "Não. Alguns equipamentos e programas precisam de suporte adicional ao H.265." },
      { question: "O original é alterado?", answer: "Não. A ferramenta cria um novo arquivo para download." },
    ],
  }),
  "mp4-para-mov": withRelated("mp4-para-mov", {
    overview: [
      "O conversor MP4 para MOV cria um arquivo no container QuickTime MOV. Quando vídeo e áudio já são compatíveis e nenhuma transformação é solicitada, o servidor pode usar remux, copiando os streams sem recompressão.",
      "Se os codecs internos forem incompatíveis ou você escolher outra qualidade, resolução ou FPS, a ferramenta recodifica o vídeo em H.264 e converte áudio incompatível para AAC.",
    ],
    useCases: [
      { title: "Edição de vídeo", description: "Prepare arquivos para programas ou fluxos que priorizam o container MOV." },
      { title: "Entrega profissional", description: "Atenda projetos ou clientes que solicitam o material em MOV." },
      { title: "Compatibilidade de fluxo", description: "Converta o container sem instalar um aplicativo adicional." },
    ],
    steps: ["Selecione um MP4 válido.", "Confira os dados detectados e ajuste qualidade, resolução ou FPS se necessário.", "Inicie a conversão para MOV.", "Baixe o arquivo gerado após a validação."],
    specifications: [
      { label: "Entrada", value: "MP4, um arquivo por vez, até 200 MB, duração máxima de 2 horas e entrada até 4K." },
      { label: "Saída", value: "Container MOV válido." },
      { label: "Estratégia", value: "Remux quando possível; recodificação em H.264/AAC quando necessária." },
      { label: "Ajustes", value: "Qualidade, resolução e FPS, sem aumento automático de resolução ou taxa de quadros." },
    ],
    privacy: serverPrivacy,
    limitations: ["MOV não garante compatibilidade com todos os programas; os codecs internos também importam.", "Recodificação pode alterar a qualidade e o tamanho do arquivo.", "A reprodução do MOV pronto no navegador depende do suporte aos codecs gerados."],
    faqs: [
      { question: "MP4 e MOV são codecs?", answer: "Não. Ambos são containers que podem armazenar vídeo, áudio e metadados codificados por formatos como H.264, HEVC e AAC." },
      { question: "A conversão perde qualidade?", answer: "Quando o remux é possível, os streams são copiados sem recompressão. Se houver recodificação, pode existir alguma alteração visual." },
      { question: "O áudio será preservado?", answer: "Sim. Áudio compatível pode ser copiado; outros formatos são convertidos para AAC quando necessário." },
      { question: "Posso converter vídeo 4K?", answer: "Sim, desde que a maior dimensão não ultrapasse 3840 pixels e os demais limites sejam respeitados." },
      { question: "O que é remux?", answer: "É a criação de um novo container copiando streams compatíveis sem recomprimir o vídeo ou o áudio." },
    ],
  }),
  "mov-para-mp4": withRelated("mov-para-mp4", {
    overview: [
      "O conversor MOV para MP4 prepara vídeos de câmeras, celulares e editores para um container amplamente aceito por navegadores, aplicativos e plataformas. A ferramenta verifica o conteúdo real do arquivo antes de gerar a saída.",
      "Quando os streams são compatíveis e nenhuma transformação é pedida, o servidor prioriza remux sem recompressão. Nos demais casos, o vídeo é convertido para H.264 e o áudio incompatível para AAC.",
    ],
    useCases: [
      { title: "Vídeos de celular", description: "Converta arquivos MOV para publicação e compartilhamento em serviços que preferem MP4." },
      { title: "Compatibilidade", description: "Prepare um vídeo para sistemas que não aceitam o container QuickTime." },
      { title: "Entrega e publicação", description: "Gere uma cópia MP4 sem modificar o arquivo MOV original." },
    ],
    steps: ["Selecione um arquivo MOV válido.", "Confira duração, resolução e codecs detectados.", "Mantenha ou ajuste qualidade, resolução e FPS.", "Converta, visualize quando o navegador suportar e baixe o MP4."],
    specifications: [
      { label: "Entrada", value: "MOV, um arquivo por vez, até 200 MB, duração máxima de 2 horas e entrada até 4K." },
      { label: "Saída", value: "Container MP4 válido." },
      { label: "Estratégia", value: "Remux para streams compatíveis ou H.264/AAC quando é preciso recodificar." },
      { label: "Orientação", value: "Proporção e orientação detectadas são preservadas." },
    ],
    privacy: serverPrivacy,
    limitations: ["HEVC dentro de MP4 pode continuar incompatível com aparelhos antigos quando preservado por remux.", "A ferramenta não promete converter HDR ou Dolby Vision para SDR.", "Recodificação pode alterar tamanho e qualidade do arquivo."],
    faqs: [
      { question: "MOV e MP4 são codecs?", answer: "Não. São containers; os codecs de vídeo e áudio ficam armazenados dentro deles." },
      { question: "Converter MOV para MP4 perde qualidade?", answer: "Não no remux, porque não há recompressão. Quando a recodificação é necessária ou solicitada, pode existir diferença visual." },
      { question: "Vídeos MOV de iPhone são compatíveis?", answer: "Podem ser, desde que o arquivo respeite os limites e seus codecs sejam processáveis pelo serviço." },
      { question: "A resolução será preservada?", answer: "Sim por padrão. A ferramenta não aumenta automaticamente as dimensões." },
      { question: "O que acontece com o áudio?", answer: "Áudio AAC ou MP3 pode ser copiado no remux; outros codecs são convertidos para AAC quando necessário." },
    ],
  }),
  "mp4-para-avi": withRelated("mp4-para-avi", {
    overview: [
      "O conversor MP4 para AVI gera um container AVI para programas, equipamentos e fluxos que ainda solicitam esse formato. A maioria dos MP4 modernos usa codecs que precisam ser recodificados para um perfil mais adequado ao AVI.",
      "Quando a recodificação é necessária, o servidor usa vídeo MPEG-4 Part 2 e áudio MP3 quando existe faixa sonora. Se o MP4 já tiver streams compatíveis e nenhuma transformação for solicitada, pode ser usado remux.",
    ],
    useCases: [
      { title: "Sistemas legados", description: "Prepare vídeos para equipamentos ou programas que exigem AVI." },
      { title: "Entrega específica", description: "Gere um arquivo no formato solicitado por um cliente ou projeto." },
      { title: "Fluxos antigos", description: "Integre um MP4 atual a processos que ainda trabalham com container AVI." },
    ],
    steps: ["Selecione um MP4 válido.", "Confira codecs, duração e resolução.", "Ajuste qualidade, resolução ou FPS se necessário.", "Converta e baixe o AVI após a verificação do arquivo."],
    specifications: [
      { label: "Entrada", value: "MP4, um arquivo por vez, até 200 MB, duração máxima de 2 horas e entrada até 4K." },
      { label: "Saída", value: "Container AVI com assinatura RIFF/AVI." },
      { label: "Recodificação", value: "MPEG-4 Part 2 com áudio MP3 quando necessária." },
      { label: "Validação", value: "O resultado é verificado pelo servidor antes de ser liberado." },
    ],
    privacy: serverPrivacy,
    limitations: ["AVI é um formato antigo e navegadores normalmente não oferecem reprodução nativa.", "HDR, Dolby Vision, capítulos, legendas e metadados avançados podem não ser preservados.", "A recodificação pode alterar qualidade e tamanho em relação ao MP4 original."],
    faqs: [
      { question: "MP4 e AVI são codecs?", answer: "Não. São containers. Os codecs internos determinam como vídeo e áudio são comprimidos." },
      { question: "O AVI gerado é um arquivo real?", answer: "Sim. O servidor gera o container AVI e verifica o resultado antes de liberar o download." },
      { question: "O áudio é mantido?", answer: "Sim. Quando existe áudio, ele é preservado; na recodificação padrão, é convertido para MP3." },
      { question: "A conversão perde qualidade?", answer: "Pode haver alguma alteração quando ocorre recodificação. Streams já compatíveis podem usar remux sem recompressão." },
      { question: "Por que o navegador pode não mostrar prévia?", answer: "A maioria dos navegadores não possui reprodução nativa de AVI, mesmo quando o arquivo é válido." },
    ],
  }),
  "compressor-de-videos": withRelated("compressor-de-videos", {
    overview: [
      "O Compressor de Vídeos reduz o tamanho de arquivos por recodificação real com FFmpeg. Ele aceita MP4, MOV, WebM, AVI, MKV, MPEG e MPG compatíveis e gera um novo MP4, permitindo controlar intensidade da compressão, resolução, FPS, bitrate, codec e áudio.",
      "A compressão é com perdas e pode alterar detalhes visuais, especialmente nos níveis mais fortes. A ferramenta oferece perfis prontos para WhatsApp, e-mail, redes sociais, sites e preservação de qualidade, além de configuração personalizada.",
    ],
    useCases: [
      { title: "Envio e compartilhamento", description: "Reduza vídeos para facilitar envio por WhatsApp, e-mail e outros serviços com limites de arquivo." },
      { title: "Publicação online", description: "Prepare arquivos menores para sites, redes sociais e sistemas de upload." },
      { title: "Economia de armazenamento", description: "Crie uma cópia mais leve quando a resolução ou bitrate do original excedem a necessidade de uso." },
    ],
    steps: [
      "Selecione um vídeo compatível e aguarde a análise do arquivo.",
      "Escolha um modo de compressão, preset ou ajuste manualmente resolução, FPS, bitrate, codec e áudio.",
      "Confira a estimativa de tamanho e inicie a compressão no servidor.",
      "Compare o resultado e baixe o novo arquivo MP4.",
    ],
    specifications: [
      { label: "Entrada", value: "MP4, MOV, WebM, AVI, MKV, MPEG ou MPG, um arquivo por vez e até 200 MB." },
      { label: "Limites", value: "Duração máxima de 2 horas e maior dimensão de entrada de até 3840 pixels." },
      { label: "Saída", value: "Arquivo MP4 com vídeo H.264 ou HEVC/H.265 e áudio AAC quando preservado." },
      { label: "Controles", value: "Compressão leve, equilibrada ou máxima, resolução até 2160p, FPS, bitrate, codec e áudio." },
    ],
    privacy: serverPrivacy,
    limitations: [
      "O tamanho final estimado não é uma garantia exata, porque cenas, codec, áudio e comportamento do encoder influenciam o resultado.",
      "Um vídeo que já esteja muito otimizado pode não apresentar redução relevante e determinadas configurações podem até gerar arquivo maior.",
      "A compressão com perdas pode reduzir detalhes; recompressões sucessivas devem ser evitadas quando a fidelidade é importante.",
      "A ferramenta depende de codecs que o FFmpeg do serviço consiga decodificar e processar.",
    ],
    faqs: [
      { question: "Quais formatos são aceitos?", answer: "MP4, MOV, WebM, AVI, MKV, MPEG e MPG, desde que o container e os codecs internos possam ser processados pelo FFmpeg." },
      { question: "Qual modo devo usar?", answer: "Compressão equilibrada é indicada para a maioria dos casos. Leve prioriza qualidade; máxima prioriza redução de tamanho." },
      { question: "Como reduzir vídeo para WhatsApp?", answer: "Use o preset WhatsApp. Ele aplica compressão máxima, limita a resolução a no máximo 720p e reduz o áudio para 96 kbps." },
      { question: "Posso escolher um tamanho aproximado em MB?", answer: "Sim. A ferramenta calcula um bitrate com base na duração, mas o resultado pode variar e não é garantido exatamente no valor informado." },
      { question: "Posso remover o áudio?", answer: "Sim. A configuração de áudio permite preservar, reduzir ou remover a faixa sonora." },
      { question: "O original é alterado?", answer: "Não. A ferramenta cria um novo MP4 e mantém o arquivo original inalterado no seu dispositivo." },
    ],
  }),
};