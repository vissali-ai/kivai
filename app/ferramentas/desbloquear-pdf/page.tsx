import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import DesbloquearPdfClient from "./desbloquear-pdf-client";

export const metadata = getToolMetadata("desbloquear-pdf");

export default function DesbloquearPdfPage() {
  return (
    <>
      <DesbloquearPdfClient />
      <PdfSpecialToolEditorialV2 slug="desbloquear-pdf" />
    </>
  );
}
