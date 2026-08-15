import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("video-para-audio");

export default function VideoParaAudioPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Vídeo para Áudio", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://www.kivai.com.br/ferramentas/video-para-audio" }).replace(/</g, "\\u003c") }} /><VideoWorkbenchClient mode="audio" /></>;
}
