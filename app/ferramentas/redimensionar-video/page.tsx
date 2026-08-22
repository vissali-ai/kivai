import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("redimensionar-video");

export default function RedimensionarVideoPage() {
  return <VideoWorkbenchClient mode="resize" />;
}
