import { VideoFrameCaptureClient } from "@/components/tools/video-frame-capture-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("capturar-frame-video");

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Capturar frame de vídeo",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  url: "https://kivai.com.br/ferramentas/capturar-frame-video",
  description: "Capture frames de vídeos diretamente no navegador e baixe a imagem em PNG ou JPG.",
};

export default function CapturarFrameVideoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <VideoFrameCaptureClient />
    </>
  );
}
