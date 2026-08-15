import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("ajustar-velocidade-video");

export default function AjustarVelocidadeVideoPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ajustar Velocidade do Vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://www.kivai.com.br/ferramentas/ajustar-velocidade-video" }).replace(/</g, "\\u003c") }} /><VideoWorkbenchClient mode="speed" /></>;
}
