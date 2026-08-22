import { VideoToolPage } from "@/components/tools/video-tool-page";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("video-para-audio"); }

export default function VideoParaAudioPage() {
  return <VideoToolPage mode="audio" />;
}
