import { VideoToolPage } from "@/components/tools/video-tool-page";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("ajustar-velocidade-video"); }

export default function AjustarVelocidadeVideoPage() {
  return <VideoToolPage mode="speed" />;
}
