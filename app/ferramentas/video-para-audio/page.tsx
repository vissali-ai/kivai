import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("video-para-audio");

export default function VideoParaAudioPage() {
  return <VideoWorkbenchClient mode="audio" />;
}
