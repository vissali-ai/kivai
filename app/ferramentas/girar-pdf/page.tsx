import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import GirarPdfClient from "./girar-pdf-client";

export const metadata = getToolMetadata("girar-pdf");

export default function Page() {
  return (
    <>
      <GirarPdfClient />
      <PdfToolEditorialV2 slug="girar-pdf" />
    </>
  );
}
