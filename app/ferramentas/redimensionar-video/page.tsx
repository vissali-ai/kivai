import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("redimensionar-video");

export default function RedimensionarVideoPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Redimensionar Vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://kivai.com.br/ferramentas/redimensionar-video" }) }} /><VideoWorkbenchClient mode="resize" /></>;
}
