import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";
import Mp4ParaAviClient from "./mp4-para-avi-client";

export const metadata = getToolMetadata("mp4-para-avi");

export default function Mp4ParaAviPage() {
  return (
    <>
      <Mp4ParaAviClient />
      <VideoServerToolEditorialV2 slug="mp4-para-avi" />
    </>
  );
}
