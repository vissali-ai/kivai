import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import HevcParaMp4Client from "./hevc-para-mp4-client";

export async function generateMetadata() { return getToolMetadataAsync("hevc-para-mp4"); }

export default function HevcParaMp4Page() {
  return (
    <>
      <HevcParaMp4Client />
      <VideoServerToolEditorialV2 slug="hevc-para-mp4" />
    </>
  );
}
