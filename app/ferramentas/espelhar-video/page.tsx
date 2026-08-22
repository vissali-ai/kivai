import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("espelhar-video"); }

export default function EspelharVideoPage() {
  return <><VideoTransformClient mode="mirror" /><VideoToolSeoContent variant="mirror" /></>;
}
