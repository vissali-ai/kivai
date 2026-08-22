import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";
import Mp4ParaMovClient from "./mp4-para-mov-client";

export const metadata = getToolMetadata("mp4-para-mov");

export default function Mp4ParaMovPage() {
  return (
    <>
      <Mp4ParaMovClient />
      <VideoServerToolEditorialV2 slug="mp4-para-mov" />
    </>
  );
}
