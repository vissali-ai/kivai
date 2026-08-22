import { VideoTransformClient } from "@/components/tools/video-transform-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("girar-video");

export default function GirarVideoPage() {
  return <VideoTransformClient mode="rotate" />;
}
