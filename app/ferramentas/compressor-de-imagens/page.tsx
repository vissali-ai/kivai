import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

import CompressorDeImagensClient from "./compressor-de-imagens-client";

export const metadata = getToolMetadata("compressor-de-imagens");

export default function CompressorDeImagensPage() {
  return (
    <main>
      <CompressorDeImagensClient />
      <ImageToolEditorial slug="compressor-de-imagens" />
    </main>
  );
}
