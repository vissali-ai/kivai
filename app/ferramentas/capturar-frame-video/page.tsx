import { VideoFrameCaptureClient } from "@/components/tools/video-frame-capture-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("capturar-frame-video");

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Gerador de Thumbnail para Vídeo",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  url: "https://kivai.com.br/ferramentas/capturar-frame-video",
  description: "Crie thumbnails a partir de frames de vídeos diretamente no navegador e baixe a imagem em PNG, JPG ou WebP.",
};

export default function CapturarFrameVideoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <VideoFrameCaptureClient />
    </>
  );
}
