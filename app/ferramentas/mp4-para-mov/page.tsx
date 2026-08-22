import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import Mp4ParaMovClient from "./mp4-para-mov-client";

export async function generateMetadata() { return getToolMetadataAsync("mp4-para-mov"); }

export default function Mp4ParaMovPage() {
  return (
    <>
      <Mp4ParaMovClient />
      <VideoServerToolEditorialV2 slug="mp4-para-mov" />
    </>
  );
}
