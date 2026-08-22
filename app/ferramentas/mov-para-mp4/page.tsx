import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";
import MovParaMp4Client from "./mov-para-mp4-client";

export const metadata = getToolMetadata("mov-para-mp4");

export default function MovParaMp4Page() {
  return (
    <>
      <MovParaMp4Client />
      <VideoServerToolEditorialV2 slug="mov-para-mp4" />
    </>
  );
}
