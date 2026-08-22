import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("remover-audio-video");

export default function RemoverAudioVideoPage() {
  return <VideoTransformClient mode="mute" />;
}
