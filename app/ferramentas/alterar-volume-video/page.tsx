import { VideoToolPage } from "@/components/tools/video-tool-page";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("alterar-volume-video"); }

export default function AlterarVolumeVideoPage() {
  return <VideoToolPage mode="volume" />;
}
