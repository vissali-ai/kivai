import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CompressorDeImagensClient from "./compressor-de-imagens-client";

export async function generateMetadata() { return getToolMetadataAsync("compressor-de-imagens"); }

export default function CompressorDeImagensPage() {
  return (
    <>
      <CompressorDeImagensClient />
      <ImageToolEditorialV2 slug="compressor-de-imagens" />
    </>
  );
}
