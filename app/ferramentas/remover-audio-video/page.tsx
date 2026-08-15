import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("remover-audio-video");
const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Remover áudio de vídeo", applicationCategory: "MultimediaApplication", operatingSystem: "Web", isAccessibleForFree: true, url: "https://www.kivai.com.br/ferramentas/remover-audio-video", description: "Remova o áudio de vídeos online diretamente no navegador." };
export default function RemoverAudioVideoPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><VideoTransformClient mode="mute" /></>; }
