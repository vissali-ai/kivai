import { ToolAiContent } from "@/components/tools/tool-ai-content";
import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PdfParaExcelClient from "./pdf-para-excel-client";

export async function generateMetadata() { return getToolMetadataAsync("pdf-para-excel"); }

export default function PdfParaExcelPage() {
  return (
    <>
      <ToolAiContent slug="pdf-para-excel"><PdfParaExcelClient /></ToolAiContent>
      <PdfOfficeToolEditorialV2 slug="pdf-para-excel" />
    </>
  );
}
