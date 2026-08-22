import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import ImagensParaPdfClient from "./imagens-para-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("imagens-para-pdf"); }

export default function ImagensParaPdfPage() {
  return (
    <>
      <ImagensParaPdfClient />
      <PdfToolEditorialV2 slug="imagens-para-pdf" />
    </>
  );
}
