import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("alterar-volume-video");

export default function AlterarVolumeVideoPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Alterar Volume do Vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://www.kivai.com.br/ferramentas/alterar-volume-video" }).replace(/</g, "\\u003c") }} /><VideoWorkbenchClient mode="volume" /></>;
}
