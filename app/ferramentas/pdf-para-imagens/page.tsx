import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PdfParaImagensClient from "./pdf-para-imagens-client";

export const metadata = getToolMetadata("pdf-para-imagens");

export default function Page() {
  return (
    <>
      <PdfParaImagensClient />
      <PdfToolEditorialV2 slug="pdf-para-imagens" />
    </>
  );
}
