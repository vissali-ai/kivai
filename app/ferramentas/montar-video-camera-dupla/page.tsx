import { DoubleVideoClient } from "@/components/tools/double-video-client";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() {
  return getToolMetadataAsync("montar-video-camera-dupla");
}

export default function MontarVideoCameraDuplaPage() {
  return <><DoubleVideoClient /><VideoToolSeoContent customSlug="montar-video-camera-dupla" /></>;
}

