import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import EditarPdfClient from "./editar-pdf-client";

export const metadata = getToolMetadata("editar-pdf");

export default function EditarPdfPage() {
  return (
    <>
      <EditarPdfClient />
      <PdfSpecialToolEditorialV2 slug="editar-pdf" />
    </>
  );
}
