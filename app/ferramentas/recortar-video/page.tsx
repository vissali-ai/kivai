import { VideoCropClient } from "@/components/tools/video-crop-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("recortar-video");

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Recortar vídeo",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  url: "https://kivai.com.br/ferramentas/recortar-video",
  description: "Recorte a área visível de vídeos diretamente no navegador e exporte em WebM.",
};

export default function RecortarVideoPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><VideoCropClient /></>;
}
