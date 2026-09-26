import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolMetadataAsync } from "@/lib/seo";
import AudioParaYoutubeClient from "./audio-para-youtube-client";

export async function generateMetadata() { return getToolMetadataAsync("audio-para-youtube"); }

const faqs = [
  { question: "Por que o YouTube não aceita meu arquivo WAV?", answer: "O envio comum do YouTube exige um arquivo de vídeo. A ferramenta combina seu áudio com uma imagem e gera um vídeo WebM compatível com o upload no YouTube." },
  { question: "A ferramenta converte WAV para MP3?", answer: "Não. O objetivo desta ferramenta é preparar um áudio para publicação no YouTube. O resultado é um arquivo de vídeo com imagem estática e a faixa de áudio recodificada pelo navegador." },
  { question: "Meu áudio é enviado para o Kivai?", answer: "Não. O processamento é feito localmente no navegador, sem enviar o áudio ou a capa para servidores do Kivai." },
  { question: "Qual é o formato de saída?", answer: "A saída é WebM, formato de vídeo aceito pelo YouTube. O codec exato depende do suporte oferecido pelo navegador." },
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
      overview={["Arquivos exclusivamente de áudio, como WAV e MP3, não podem ser enviados pelo fluxo comum de vídeos do YouTube.", "Esta ferramenta cria um vídeo com uma imagem estática e o seu áudio, pronto para ser enviado como conteúdo de vídeo."]}
      useCases={[{ title: "Publicar áudio no YouTube", description: "Prepare músicas, podcasts, demos e gravações para o upload como vídeo." }, { title: "Converter sem editor profissional", description: "Transforme um WAV ou outro áudio em vídeo diretamente pelo navegador." }, { title: "Usar uma capa personalizada", description: "Adicione uma imagem ao áudio antes da publicação." }, { title: "Preparar arquivos rapidamente", description: "Adapte áudios recebidos de estúdios, artistas ou clientes para o YouTube." }]}
      steps={["Selecione seu arquivo WAV, MP3, M4A, AAC ou FLAC.", "Opcionalmente, envie uma imagem JPG, PNG ou WebP para usar como capa.", "Escolha 1080p ou 720p e confira a prévia.", "Clique em Criar vídeo para YouTube e aguarde o processamento local.", "Baixe o arquivo WebM e envie-o pelo YouTube Studio."]}
      specifications={[{ label: "Entrada", value: "WAV, MP3, M4A, AAC e FLAC, conforme suporte do navegador." }, { label: "Capa", value: "JPG, PNG ou WebP." }, { label: "Proporção", value: "16:9." }, { label: "Resoluções", value: "1920 × 1080 ou 1280 × 720." }, { label: "Saída", value: "WebM com vídeo e áudio." }, { label: "Processamento", value: "Local. Os arquivos permanecem no dispositivo." }]}
      privacy="O áudio e a imagem de capa são processados diretamente no seu navegador. O Kivai não precisa receber esses arquivos para gerar o vídeo."
      limitations={["A compatibilidade de leitura e codificação depende do navegador e do dispositivo.", "Para arquivos longos ou muito pesados, o processamento pode consumir memória e levar aproximadamente a duração do áudio."]}
      faqs={faqs}
      relatedTools={[{ href: "/ferramentas/video-para-audio", label: "Vídeo para Áudio" }, { href: "/ferramentas/compressor-de-videos", label: "Compressor de Vídeos" }, { href: "/ferramentas/mp4-para-mov", label: "MP4 para MOV" }]}
      afterFaq={<AdSlot placement="tool-bottom" />}
    />
  </>;
}
