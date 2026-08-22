import { VideoCropClient } from "@/components/tools/video-crop-client";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("recortar-video"); }

export default function RecortarVideoPage() {
  return <><VideoCropClient /><VideoToolSeoContent variant="crop" /></>;
}
