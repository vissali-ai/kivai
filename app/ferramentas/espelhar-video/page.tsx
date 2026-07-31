import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("espelhar-video");
const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Espelhar vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://kivai.com.br/ferramentas/espelhar-video", description: "Espelhe vídeos horizontalmente ou verticalmente no navegador." };
export default function EspelharVideoPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><VideoTransformClient mode="mirror" /></>; }
