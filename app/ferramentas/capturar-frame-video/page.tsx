import { VideoFrameCaptureClient } from "@/components/tools/video-frame-capture-client";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("capturar-frame-video"); }

export default function CapturarFrameVideoPage() {
  return <><VideoFrameCaptureClient /><VideoToolSeoContent variant="thumbnail" /></>;
}
