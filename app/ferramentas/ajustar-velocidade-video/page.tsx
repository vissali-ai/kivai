import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("ajustar-velocidade-video");

export default function AjustarVelocidadeVideoPage() {
  return <VideoWorkbenchClient mode="speed" />;
}
