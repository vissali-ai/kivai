import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import ExcelParaPdfClient from "./excel-para-pdf-client";

export const metadata = getToolMetadata("excel-para-pdf");

export default function ExcelParaPdfPage() {
  return (
    <>
      <ExcelParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="excel-para-pdf" />
    </>
  );
}
