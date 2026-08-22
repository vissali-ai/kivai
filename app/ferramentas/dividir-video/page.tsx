import { VideoWorkbenchClient } from "@/components/tools/video-workbench-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("dividir-video");

export default function DividirVideoPage() {
  return <VideoWorkbenchClient mode="split" />;
}
