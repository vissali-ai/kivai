import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("girar-video");
const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Girar vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://www.kivai.com.br/ferramentas/girar-video", description: "Gire vídeos online diretamente no navegador." };
export default function GirarVideoPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><VideoTransformClient mode="rotate" /></>; }
