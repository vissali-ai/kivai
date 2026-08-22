import { VideoCropClient } from "@/components/tools/video-crop-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("recortar-video");

export default function RecortarVideoPage() {
  return <VideoCropClient />;
}
