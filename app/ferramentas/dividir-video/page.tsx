import { VideoToolPage } from "@/components/tools/video-tool-page";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("dividir-video"); }

export default function DividirVideoPage() {
  return <VideoToolPage mode="split" />;
}
