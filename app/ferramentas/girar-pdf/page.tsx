import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import GirarPdfClient from "./girar-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("girar-pdf"); }

export default function Page() {
  return (
    <>
      <GirarPdfClient />
      <PdfToolEditorialV2 slug="girar-pdf" />
    </>
  );
}
