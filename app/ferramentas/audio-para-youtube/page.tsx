import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolMetadataAsync } from "@/lib/seo";
import AudioParaYoutubeClient from "./audio-para-youtube-client";

export async function generateMetadata() { return getToolMetadataAsync("audio-para-youtube"); }

const faqs: [string, string][] = [
  ["Por que o YouTube não aceita meu arquivo WAV?", "O envio comum do YouTube exige um arquivo de vídeo. A ferramenta combina seu áudio com uma imagem e gera um vídeo WebM compatível com o upload no YouTube."],
  ["A ferramenta converte WAV para MP3?", "Não. O objetivo desta ferramenta é preparar um áudio para publicação no YouTube. O resultado é um arquivo de vídeo com imagem estática e a faixa de áudio recodificada pelo navegador."],
  ["Meu áudio é enviado para o Kivai?", "Não. O processamento é feito localmente no navegador, sem enviar o áudio ou a capa para servidores do Kivai."],
  ["Qual é o formato de saída?", "A saída é WebM, formato de vídeo aceito pelo YouTube. O codec exato depende do suporte oferecido pelo navegador."],
];

export default function AudioParaYoutubePage() {
  const schema = buildToolPageSchema({
    name: "Áudio para YouTube", slug: "audio-para-youtube",
    description: "Transforme WAV, MP3, M4A, AAC ou FLAC em vídeo com capa para enviar ao YouTube.",
    breadcrumbs: [{ name: "Início", href: "/" }, { name: "Ferramentas", href: "/ferramentas" }, { name: "Áudio", href: "/ferramentas/audio" }, { name: "Áudio para YouTube", href: "/ferramentas/audio-para-youtube" }],
    faqs,
  });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <AudioParaYoutubeClient />
    <ToolEditorialLayout
      slug="audio-para-youtube"
      overview="Arquivos exclusivamente de áudio, como WAV e MP3, não podem ser enviados pelo fluxo comum de vídeos do YouTube. Esta ferramenta cria um vídeo com uma imagem estática e o seu áudio, pronto para ser enviado como conteúdo de vídeo."
      useCases={["Publicar músicas, podcasts, demos e gravações no YouTube.", "Transformar um WAV em vídeo sem precisar abrir um editor profissional.", "Adicionar uma capa personalizada ao áudio antes da publicação.", "Preparar rapidamente arquivos de áudio recebidos de estúdios, artistas ou clientes."]}
      steps={["Selecione seu arquivo WAV, MP3, M4A, AAC ou FLAC.", "Opcionalmente, envie uma imagem JPG, PNG ou WebP para usar como capa.", "Escolha 1080p ou 720p e confira a prévia.", "Clique em Criar vídeo para YouTube e aguarde o processamento local.", "Baixe o arquivo WebM e envie-o pelo YouTube Studio."]}
      specifications={["Entrada: WAV, MP3, M4A, AAC e FLAC, conforme suporte do navegador.", "Capa: JPG, PNG ou WebP.", "Proporção: 16:9.", "Resoluções: 1920 × 1080 ou 1280 × 720.", "Saída: WebM com vídeo e áudio.", "Processamento local: os arquivos permanecem no dispositivo."]}
      privacy="O áudio e a imagem de capa são processados diretamente no seu navegador. O Kivai não precisa receber esses arquivos para gerar o vídeo."
      limitations="A compatibilidade de leitura e codificação depende do navegador e do dispositivo. Para arquivos longos ou muito pesados, o processamento pode consumir memória e levar aproximadamente a duração do áudio."
      faqs={faqs}
      relatedTools={["video-para-audio", "compressor-de-videos", "mp4-para-mov"]}
      afterFaq={<AdSlot placement="tool-bottom" />}
    />
  </>;
}
