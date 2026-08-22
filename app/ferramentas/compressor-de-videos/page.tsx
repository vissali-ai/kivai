import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import CompressorDeVideosClient from "./compressor-de-videos-client";

export async function generateMetadata() { return getToolMetadataAsync("compressor-de-videos"); }

export default function CompressorDeVideosPage() {
  return (
    <>
      <CompressorDeVideosClient />
      <VideoServerToolEditorialV2 slug="compressor-de-videos" />
    </>
  );
}
