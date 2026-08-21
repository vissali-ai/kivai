import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import CompressorDeImagensClient from "./compressor-de-imagens-client";

export const metadata = getToolMetadata("compressor-de-imagens");

export default function CompressorDeImagensPage() {
  return (
    <>
      <CompressorDeImagensClient />
      <ImageToolEditorialV2 slug="compressor-de-imagens" />
    </>
  );
}
