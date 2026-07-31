import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("video-para-audio");

export default function VideoParaAudioPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Vídeo para Áudio", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://kivai.com.br/ferramentas/video-para-audio" }) }} /><VideoWorkbenchClient mode="audio" /></>;
}
