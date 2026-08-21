import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PdfParaExcelClient from "./pdf-para-excel-client";

export const metadata = getToolMetadata("pdf-para-excel");

export default function PdfParaExcelPage() {
  return (
    <>
      <PdfParaExcelClient />
      <PdfOfficeToolEditorialV2 slug="pdf-para-excel" />
    </>
  );
}
