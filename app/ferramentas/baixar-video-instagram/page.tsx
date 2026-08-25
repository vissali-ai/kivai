import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import BaixarVideoInstagramClient from "./baixar-video-instagram-client";

export async function generateMetadata() {
  return getToolMetadataAsync("baixar-video-instagram");
}

export default function BaixarVideoInstagramPage() {
  return (
    <>
      <BaixarVideoInstagramClient />
      <VideoServerToolEditorialV2 slug="baixar-video-instagram" />
    </>
  );
}
