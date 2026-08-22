import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import Mp4ParaAviClient from "./mp4-para-avi-client";

export async function generateMetadata() { return getToolMetadataAsync("mp4-para-avi"); }

export default function Mp4ParaAviPage() {
  return (
    <>
      <Mp4ParaAviClient />
      <VideoServerToolEditorialV2 slug="mp4-para-avi" />
    </>
  );
}
