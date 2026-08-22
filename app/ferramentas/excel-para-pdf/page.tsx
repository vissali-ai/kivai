import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import ExcelParaPdfClient from "./excel-para-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("excel-para-pdf"); }

export default function ExcelParaPdfPage() {
  return (
    <>
      <ExcelParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="excel-para-pdf" />
    </>
  );
}
