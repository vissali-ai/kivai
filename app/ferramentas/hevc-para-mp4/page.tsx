import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";
import HevcParaMp4Client from "./hevc-para-mp4-client";

export const metadata = getToolMetadata("hevc-para-mp4");

export default function HevcParaMp4Page() {
  return (
    <>
      <HevcParaMp4Client />
      <VideoServerToolEditorialV2 slug="hevc-para-mp4" />
    </>
  );
}
