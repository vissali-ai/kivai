import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("girar-video"); }

export default function GirarVideoPage() {
  return <><VideoTransformClient mode="rotate" /><VideoToolSeoContent variant="rotate" /></>;
}
