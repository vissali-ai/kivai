import { getToolMetadata } from "@/lib/seo";

import CompressorDeImagensClient from "./compressor-de-imagens-client";

export const metadata = getToolMetadata("compressor-de-imagens");

export default function CompressorDeImagensPage() {
  return (
    <main>
      <CompressorDeImagensClient />
    </main>
  );
}
