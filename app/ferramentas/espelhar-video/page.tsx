import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("espelhar-video");

export default function EspelharVideoPage() {
  return <VideoTransformClient mode="mirror" />;
}
