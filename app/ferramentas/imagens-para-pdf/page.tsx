import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import ImagensParaPdfClient from "./imagens-para-pdf-client";

export const metadata = getToolMetadata("imagens-para-pdf");

export default function ImagensParaPdfPage() {
  return (
    <>
      <ImagensParaPdfClient />
      <PdfToolEditorialV2 slug="imagens-para-pdf" />
    </>
  );
}
