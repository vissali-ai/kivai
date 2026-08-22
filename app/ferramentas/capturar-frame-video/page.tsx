import { VideoFrameCaptureClient } from "@/components/tools/video-frame-capture-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("capturar-frame-video");

export default function CapturarFrameVideoPage() {
  return <VideoFrameCaptureClient />;
}
