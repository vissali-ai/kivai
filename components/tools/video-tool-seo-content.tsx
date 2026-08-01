"use client";

type Variant = "volume" | "speed" | "resize" | "split" | "audio" | "rotate" | "mirror" | "mute" | "crop" | "thumbnail";

const content: Record<Variant, { title: string; paragraphs: string[] }> = {
  volume: {
    title: "Como alterar o volume de um vídeo online",
    paragraphs: [
      "Use esta ferramenta para reduzir ruídos, aumentar a presença da fala ou criar uma versão sem som. O controle permite escolher de 0% a 300% e gerar um novo arquivo sem enviar o vídeo para servidores.",
      "Antes de baixar, confira o resultado no player. A qualidade final e a disponibilidade da faixa de áudio dependem do codec do arquivo e do suporte do navegador usado no dispositivo.",
    ],
  },
  speed: {
    title: "Ajuste a velocidade do vídeo com controle",
    paragraphs: [
      "Acelere conteúdos longos, crie vídeos em câmera rápida ou desacelere uma cena para destacar detalhes. A duração estimada é atualizada de acordo com a velocidade selecionada.",
      "A reprodução é recodificada localmente para gerar um novo arquivo. Em navegadores compatíveis, o áudio acompanha a nova velocidade durante a exportação.",
    ],
  },
  resize: {
    title: "Redimensione vídeos sem distorcer a imagem",
    paragraphs: [
      "Defina uma resolução para redes sociais, apresentações ou sites e escolha como o vídeo deve ocupar o quadro. O modo Ajustar preserva todo o conteúdo com bordas, enquanto Preencher ocupa a tela cortando apenas as bordas necessárias.",
      "Use Esticar somente quando a distorção for intencional. Para manter a proporção original, deixe a opção correspondente marcada ao editar largura ou altura.",
    ],
  },
  split: {
    title: "Divida um vídeo em duas partes no ponto exato",
    paragraphs: [
      "Escolha o segundo de separação na linha do tempo. A ferramenta gera uma primeira parte do início até o ponto selecionado e uma segunda parte com o conteúdo restante.",
      "O corte é feito durante a recodificação local para priorizar precisão visual. Vídeos maiores podem levar mais tempo, conforme a resolução e a capacidade do dispositivo.",
    ],
  },
  audio: {
    title: "Extraia o áudio do seu vídeo de forma privada",
    paragraphs: [
      "Envie um vídeo com faixa de áudio e baixe apenas o som em WebM. É uma opção prática para salvar entrevistas, aulas e narrações quando o navegador reconhecer o codec do arquivo original.",
      "Nenhum arquivo é enviado ao Kivai. Caso o vídeo não possua áudio ou o navegador não exponha a faixa para processamento, a ferramenta mostra uma mensagem clara em vez de gerar um arquivo vazio.",
    ],
  },
  rotate: {
    title: "Corrija a orientação de vídeos gravados no celular",
    paragraphs: [
      "Selecione 90°, 180° ou 270° para ajustar vídeos que foram gravados ou exportados na orientação errada. A prévia permite conferir a rotação antes de iniciar a exportação.",
      "O vídeo é redesenhado e codificado no próprio navegador. Assim, o arquivo permanece privado no dispositivo durante todo o processo.",
    ],
  },
  mirror: {
    title: "Espelhe vídeos horizontalmente ou verticalmente",
    paragraphs: [
      "O espelhamento horizontal cria o efeito de câmera frontal, enquanto o vertical inverte a imagem de cima para baixo. É possível combinar os dois controles para obter a inversão completa.",
      "Confira a prévia antes de exportar. O resultado é gerado localmente em WebM, sem upload para um serviço de terceiros.",
    ],
  },
  mute: {
    title: "Remova o áudio de um vídeo sem enviar o arquivo",
    paragraphs: [
      "Crie uma versão silenciosa para apresentações, redes sociais ou novas trilhas sonoras. A imagem do vídeo é preservada enquanto a faixa de áudio é excluída na exportação.",
      "Depois de processar, reproduza o resultado antes de baixar. A conversão é local e o arquivo original continua apenas no seu dispositivo.",
    ],
  },
  crop: {
    title: "Recorte a área visível de um vídeo",
    paragraphs: [
      "Defina a posição e o tamanho da área que deve permanecer no vídeo. Os controles em porcentagem permitem remover bordas, adaptar o enquadramento e destacar uma parte da cena.",
      "Use a prévia do recorte para validar a composição antes da exportação. O processamento é feito no navegador e gera um novo vídeo em WebM.",
    ],
  },
  thumbnail: {
    title: "Crie thumbnails a partir de qualquer momento do vídeo",
    paragraphs: [
      "Navegue pela linha do tempo, avance ou retroceda segundos e selecione o frame que melhor representa seu conteúdo. A thumbnail pode ser baixada em PNG, JPG ou WebP.",
      "Escolha a resolução original ou um tamanho pronto para publicação. A captura usa o próprio navegador e não envia o vídeo ou a imagem resultante para servidores externos.",
    ],
  },
};

export function VideoToolSeoContent({ variant }: { variant: Variant }) {
  const item = content[variant];
  return (
    <section className="mx-auto mt-10 max-w-4xl rounded-xl border border-border p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Para que serve esta ferramenta?</h2>
      <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        {item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}
