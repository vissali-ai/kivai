import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import EditarPdfClient from "./editar-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("editar-pdf"); }

export default function EditarPdfPage() {
  return (
    <>
      <EditarPdfClient />
      <PdfSpecialToolEditorialV2 slug="editar-pdf" />
    </>
  );
}
