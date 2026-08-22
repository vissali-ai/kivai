import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import DividirPdfClient from "./dividir-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("dividir-pdf"); }

export default function Page() {
  return (
    <>
      <DividirPdfClient />
      <PdfToolEditorialV2 slug="dividir-pdf" />
    </>
  );
}
