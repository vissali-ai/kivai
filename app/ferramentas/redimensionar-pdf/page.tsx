import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import RedimensionarPdfClient from "./redimensionar-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("redimensionar-pdf"); }

export default function RedimensionarPdfPage() {
  return (
    <>
      <RedimensionarPdfClient />
      <PdfSpecialToolEditorialV2 slug="redimensionar-pdf" />
    </>
  );
}
