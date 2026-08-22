import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import Mp4ParaHevcClient from "./mp4-para-hevc-client";

export async function generateMetadata() { return getToolMetadataAsync("mp4-para-hevc"); }

export default function Mp4ParaHevcPage() {
  return (
    <>
      <Mp4ParaHevcClient />
      <VideoServerToolEditorialV2 slug="mp4-para-hevc" />
    </>
  );
}
