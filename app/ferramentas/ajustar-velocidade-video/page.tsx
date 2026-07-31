import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("ajustar-velocidade-video");

export default function AjustarVelocidadeVideoPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ajustar Velocidade do Vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://kivai.com.br/ferramentas/ajustar-velocidade-video" }) }} /><VideoWorkbenchClient mode="speed" /></>;
}
