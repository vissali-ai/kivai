import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import DividirPdfClient from "./dividir-pdf-client";

export const metadata = getToolMetadata("dividir-pdf");

export default function Page() {
  return (
    <>
      <DividirPdfClient />
      <PdfToolEditorialV2 slug="dividir-pdf" />
    </>
  );
}
