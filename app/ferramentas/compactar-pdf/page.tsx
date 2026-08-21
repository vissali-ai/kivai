import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import CompactarPdfClient from "./compactar-pdf-client";

export const metadata = getToolMetadata("compactar-pdf");

export default function Page() {
  return (
    <>
      <CompactarPdfClient />
      <PdfToolEditorialV2 slug="compactar-pdf" />
    </>
  );
}
