import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("dividir-video");

export default function DividirVideoPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Dividir Vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://kivai.com.br/ferramentas/dividir-video" }) }} /><VideoWorkbenchClient mode="split" /></>;
}
