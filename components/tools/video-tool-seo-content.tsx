"use client";

type Variant = "volume" | "speed" | "resize" | "split" | "audio" | "rotate" | "mirror" | "mute" | "crop" | "thumbnail";

type VideoSeoContent = {
  title: string;
  paragraphs: string[];
  useCases: string[];
  details: { label: string; value: string }[];
  limitations: string[];
};

const content: Record<Variant, VideoSeoContent> = {
  volume: {
    title: "Como alterar o volume de um vídeo online",
    paragraphs: [
      "Use esta ferramenta para reduzir ruídos, aumentar a presença da fala ou criar uma versão sem som. O controle permite escolher de 0% a 300% e gerar um novo arquivo sem enviar o vídeo para servidores.",
      "Antes de baixar, confira o resultado no player. A qualidade final e a disponibilidade da faixa de áudio dependem do codec do arquivo e do suporte do navegador usado no dispositivo.",
    ],
    useCases: ["Equilibrar falas gravadas em volume baixo.", "Reduzir o som antes de adicionar outra trilha em um editor.", "Criar uma cópia silenciosa usando o ajuste de 0%."],
    details: [{ label: "Faixa de ajuste", value: "De 0% a 300% do volume capturado." }, { label: "Entrada", value: "Vídeos MP4, WebM ou MOV que o navegador consiga reproduzir." }, { label: "Saída", value: "Novo vídeo WebM, com áudio processado quando o navegador expõe a faixa." }, { label: "Processamento", value: "Mixagem e recodificação locais, durante a reprodução do arquivo." }],
    limitations: ["Elevar muito o volume também amplia ruídos e pode causar distorção.", "A ferramenta não remove ruído nem normaliza loudness automaticamente.", "Codecs não reconhecidos pelo navegador podem impedir a leitura ou exportação do áudio."],
  },
  speed: {
    title: "Ajuste a velocidade do vídeo com controle",
    paragraphs: [
      "Acelere conteúdos longos, crie vídeos em câmera rápida ou desacelere uma cena para destacar detalhes. A duração estimada é atualizada de acordo com a velocidade selecionada.",
      "A reprodução é recodificada localmente para gerar um novo arquivo. Em navegadores compatíveis, o áudio acompanha a nova velocidade durante a exportação.",
    ],
    useCases: ["Acelerar tutoriais, aulas ou gravações extensas.", "Produzir um efeito de câmera rápida.", "Desacelerar uma cena para observar movimentos e detalhes."],
    details: [{ label: "Velocidades", value: "De 0,25× a 4×, incluindo controles predefinidos." }, { label: "Duração", value: "A duração estimada é a duração original dividida pela velocidade escolhida." }, { label: "Saída", value: "Vídeo WebM recodificado no ritmo selecionado." }, { label: "Áudio", value: "Mantido e sincronizado somente quando a captura do navegador for compatível." }],
    limitations: ["Velocidades extremas podem reduzir a naturalidade do áudio e do movimento.", "A exportação ocorre em tempo de reprodução e pode demorar em vídeos longos.", "A compatibilidade com a faixa de áudio depende do codec e do navegador."],
  },
  resize: {
    title: "Redimensione vídeos sem distorcer a imagem",
    paragraphs: [
      "Defina uma resolução para redes sociais, apresentações ou sites e escolha como o vídeo deve ocupar o quadro. O modo Ajustar preserva todo o conteúdo com bordas, enquanto Preencher ocupa a tela cortando apenas as bordas necessárias.",
      "Use Esticar somente quando a distorção for intencional. Para manter a proporção original, deixe a opção correspondente marcada ao editar largura ou altura.",
    ],
    useCases: ["Preparar vídeos horizontais, verticais ou quadrados.", "Reduzir a resolução antes de compartilhar um arquivo.", "Adaptar uma gravação a uma área específica de um site ou apresentação."],
    details: [{ label: "Dimensões", value: "Largura e altura entre 16 e 3840 pixels." }, { label: "Ajustar", value: "Preserva todo o quadro e adiciona bordas quando necessário." }, { label: "Preencher", value: "Ocupa a resolução escolhida e corta excedentes nas bordas." }, { label: "Esticar", value: "Força a imagem a preencher o quadro, podendo alterar a proporção." }],
    limitations: ["Aumentar a resolução não recupera detalhes ausentes no arquivo original.", "O modo Preencher pode remover partes das bordas.", "Resoluções altas exigem mais memória e processamento do dispositivo."],
  },
  split: {
    title: "Divida um vídeo em duas partes no ponto exato",
    paragraphs: [
      "Escolha o segundo de separação na linha do tempo. A ferramenta gera uma primeira parte do início até o ponto selecionado e uma segunda parte com o conteúdo restante.",
      "O corte é feito durante a recodificação local para priorizar precisão visual. Vídeos maiores podem levar mais tempo, conforme a resolução e a capacidade do dispositivo.",
    ],
    useCases: ["Separar introdução e conteúdo principal.", "Remover manualmente uma parte usando apenas um dos resultados.", "Dividir uma gravação longa em dois arquivos menores."],
    details: [{ label: "Ponto de divisão", value: "Selecionado em segundos entre o início e o final do vídeo." }, { label: "Parte 1", value: "Vai de 0:00 até o ponto selecionado." }, { label: "Parte 2", value: "Vai do ponto selecionado até o final." }, { label: "Saída", value: "Dois vídeos WebM recodificados localmente." }],
    limitations: ["A ferramenta cria exatamente duas partes por operação.", "O corte exige recodificação e não preserva necessariamente o tamanho original do arquivo.", "O áudio depende do suporte de captura oferecido pelo navegador."],
  },
  audio: {
    title: "Extraia o áudio do seu vídeo de forma privada",
    paragraphs: [
      "Envie um vídeo com faixa de áudio e baixe apenas o som em WebM. É uma opção prática para salvar entrevistas, aulas e narrações quando o navegador reconhecer o codec do arquivo original.",
      "Nenhum arquivo é enviado ao Kivai. Caso o vídeo não possua áudio ou o navegador não exponha a faixa para processamento, a ferramenta mostra uma mensagem clara em vez de gerar um arquivo vazio.",
    ],
    useCases: ["Salvar a narração de uma aula ou entrevista autorizada.", "Extrair uma gravação de voz para edição posterior.", "Ouvir o conteúdo de um vídeo sem manter a faixa visual."],
    details: [{ label: "Entrada", value: "Vídeo com faixa de áudio reconhecida pelo navegador." }, { label: "Saída no Safari", value: "Áudio M4A quando o navegador disponibilizar essa codificação." }, { label: "Saída em outros navegadores", value: "Áudio WebM com Opus quando compatível." }, { label: "Qualidade", value: "Codificação local com taxa solicitada de até 192 kbps." }],
    limitations: ["A ferramenta não funciona quando o vídeo não possui faixa de áudio acessível.", "Arquivos protegidos ou codecs incompatíveis podem não ser processados.", "A saída varia entre navegadores e não oferece conversão direta para MP3."],
  },
  rotate: {
    title: "Corrija a orientação de vídeos gravados no celular",
    paragraphs: [
      "Selecione 90°, 180° ou 270° para ajustar vídeos que foram gravados ou exportados na orientação errada. A prévia permite conferir a rotação antes de iniciar a exportação.",
      "O vídeo é redesenhado e codificado no próprio navegador. Assim, o arquivo permanece privado no dispositivo durante todo o processo.",
    ],
    useCases: ["Corrigir gravações que aparecem de lado.", "Inverter vídeos gravados de cabeça para baixo.", "Preparar a orientação correta antes de outras edições."],
    details: [{ label: "Ângulos", value: "0°, 90°, 180° ou 270°." }, { label: "Prévia", value: "O quadro transformado pode ser conferido antes da exportação." }, { label: "Saída", value: "Vídeo WebM com as dimensões ajustadas à rotação." }, { label: "Áudio", value: "Mantido quando a captura da faixa for suportada." }],
    limitations: ["A operação recodifica o vídeo e pode alterar tamanho e compressão.", "Metadados de orientação do arquivo original não são preservados como método de rotação.", "A exportação depende de Canvas, MediaRecorder e WebM."],
  },
  mirror: {
    title: "Espelhe vídeos horizontalmente ou verticalmente",
    paragraphs: [
      "O espelhamento horizontal cria o efeito de câmera frontal, enquanto o vertical inverte a imagem de cima para baixo. É possível combinar os dois controles para obter a inversão completa.",
      "Confira a prévia antes de exportar. O resultado é gerado localmente em WebM, sem upload para um serviço de terceiros.",
    ],
    useCases: ["Corrigir textos invertidos por gravação com câmera frontal.", "Criar uma variação simétrica de uma cena.", "Inverter horizontal ou verticalmente uma gravação."],
    details: [{ label: "Horizontal", value: "Troca os lados esquerdo e direito do quadro." }, { label: "Vertical", value: "Inverte a imagem de cima para baixo." }, { label: "Combinação", value: "Os dois controles podem ser aplicados ao mesmo tempo." }, { label: "Saída", value: "Novo vídeo WebM processado no dispositivo." }],
    limitations: ["Textos e logotipos também ficam invertidos com a imagem.", "A transformação não corrige perspectiva ou inclinação de câmera.", "O áudio só é preservado quando o navegador disponibiliza a faixa."],
  },
  mute: {
    title: "Remova o áudio de um vídeo sem enviar o arquivo",
    paragraphs: [
      "Crie uma versão silenciosa para apresentações, redes sociais ou novas trilhas sonoras. A imagem do vídeo é preservada enquanto a faixa de áudio é excluída na exportação.",
      "Depois de processar, reproduza o resultado antes de baixar. A conversão é local e o arquivo original continua apenas no seu dispositivo.",
    ],
    useCases: ["Criar vídeos silenciosos para telas e apresentações.", "Preparar uma base visual para receber uma nova trilha.", "Remover conversas ou sons antes de compartilhar uma gravação."],
    details: [{ label: "Alteração", value: "A faixa visual é recodificada sem adicionar áudio à saída." }, { label: "Arquivo original", value: "Permanece intacto no dispositivo." }, { label: "Saída", value: "Vídeo WebM silencioso." }, { label: "Privacidade", value: "O arquivo não é enviado ao Kivai durante o processo." }],
    limitations: ["A remoção é definitiva apenas na cópia exportada; guarde o original se precisar do som.", "A ferramenta não permite remover somente um trecho do áudio.", "Codecs de vídeo não suportados podem impedir a abertura do arquivo."],
  },
  crop: {
    title: "Recorte a área visível de um vídeo",
    paragraphs: [
      "Defina a posição e o tamanho da área que deve permanecer no vídeo. Os controles em porcentagem permitem remover bordas, adaptar o enquadramento e destacar uma parte da cena.",
      "Use a prévia do recorte para validar a composição antes da exportação. O processamento é feito no navegador e gera um novo vídeo em WebM.",
    ],
    useCases: ["Remover bordas ou objetos nas extremidades.", "Mudar o enquadramento para destacar uma região.", "Adaptar a área visível antes de publicar o vídeo."],
    details: [{ label: "Controles", value: "Posição e tamanho do recorte definidos em porcentagens." }, { label: "Prévia", value: "Mostra a região mantida antes de iniciar a codificação." }, { label: "Saída", value: "Vídeo WebM contendo apenas a área selecionada." }, { label: "Áudio", value: "Incluído quando o navegador disponibiliza a faixa para captura." }],
    limitations: ["Recortar remove pixels das bordas e não pode revelar conteúdo fora do quadro original.", "Recortes muito pequenos reduzem a resolução final.", "O resultado depende do suporte local a Canvas, MediaRecorder e codecs."],
  },
  thumbnail: {
    title: "Crie thumbnails a partir de qualquer momento do vídeo",
    paragraphs: [
      "Navegue pela linha do tempo, avance ou retroceda segundos e selecione o frame que melhor representa seu conteúdo. A thumbnail pode ser baixada em PNG, JPG ou WebP.",
      "Escolha a resolução original ou um tamanho pronto para publicação. A captura usa o próprio navegador e não envia o vídeo ou a imagem resultante para servidores externos.",
    ],
    useCases: ["Criar capa para uma publicação ou player.", "Registrar um quadro específico para documentação.", "Obter uma imagem de referência sem fazer captura de tela."],
    details: [{ label: "Navegação", value: "Controle pela linha do tempo e avanço ou retrocesso por segundos." }, { label: "Formatos", value: "PNG, JPG e WebP, conforme a finalidade da imagem." }, { label: "Resolução", value: "Original do frame ou tamanhos predefinidos disponíveis na interface." }, { label: "Saída", value: "Imagem estática gerada diretamente a partir do quadro exibido." }],
    limitations: ["A nitidez máxima é limitada pela resolução do vídeo original.", "Vídeos protegidos ou com codec incompatível podem não abrir.", "A ferramenta captura um quadro; ela não cria thumbnails com texto, colagens ou efeitos."],
  },
};

export function VideoToolSeoContent({ variant }: { variant: Variant }) {
  const item = content[variant];
  return (
    <section className="mx-auto mt-10 max-w-4xl space-y-6">
      <article className="rounded-xl border border-border p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Para que serve esta ferramenta?</h2>
        <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
        <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">{item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </article>
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-border p-5 sm:p-6"><h2 className="text-xl font-semibold">Quando utilizar</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{item.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}</ul></article>
        <article className="rounded-xl border border-border p-5 sm:p-6"><h2 className="text-xl font-semibold">Limitações importantes</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{item.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></article>
      </div>
      <article className="rounded-xl border border-border p-5 sm:p-6"><h2 className="text-xl font-semibold">Formatos, controles e resultado</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2">{item.details.map(({ label, value }) => <div key={label} className="rounded-lg border border-border bg-muted/10 p-4"><dt className="text-sm font-semibold">{label}</dt><dd className="mt-2 text-sm leading-6 text-muted-foreground">{value}</dd></div>)}</dl></article>
    </section>
  );
}
