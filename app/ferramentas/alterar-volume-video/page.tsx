import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("alterar-volume-video");

export default function AlterarVolumeVideoPage() {
  return <VideoWorkbenchClient mode="volume" />;
}
