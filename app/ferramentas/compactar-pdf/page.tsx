import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CompactarPdfClient from "./compactar-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("compactar-pdf"); }

export default function Page() {
  return (
    <>
      <CompactarPdfClient />
      <PdfToolEditorialV2 slug="compactar-pdf" />
    </>
  );
}
