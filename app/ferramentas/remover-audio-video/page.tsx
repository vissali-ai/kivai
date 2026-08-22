import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("remover-audio-video"); }

export default function RemoverAudioVideoPage() {
  return <><VideoTransformClient mode="mute" /><VideoToolSeoContent variant="mute" /></>;
}
