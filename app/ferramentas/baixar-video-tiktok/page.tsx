import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import BaixarVideoTikTokClient from "./baixar-video-tiktok-client";

export async function generateMetadata() {
  return getToolMetadataAsync("baixar-video-tiktok");
}

export default function BaixarVideoTikTokPage() {
  return (
    <>
      <BaixarVideoTikTokClient />
      <VideoServerToolEditorialV2 slug="baixar-video-tiktok" />
    </>
  );
}
