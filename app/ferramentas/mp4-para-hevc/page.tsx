import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";
import Mp4ParaHevcClient from "./mp4-para-hevc-client";

export const metadata = getToolMetadata("mp4-para-hevc");

export default function Mp4ParaHevcPage() {
  return (
    <>
      <Mp4ParaHevcClient />
      <VideoServerToolEditorialV2 slug="mp4-para-hevc" />
    </>
  );
}
