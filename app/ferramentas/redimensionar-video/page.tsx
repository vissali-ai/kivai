import { VideoToolPage } from "@/components/tools/video-tool-page";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("redimensionar-video"); }

export default function RedimensionarVideoPage() {
  return <VideoToolPage mode="resize" />;
}
