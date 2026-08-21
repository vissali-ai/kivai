import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PdfParaWordClient from "./pdf-para-word-client";

export const metadata = getToolMetadata("pdf-para-word");

export default function PdfParaWordPage() {
  return (
    <>
      <PdfParaWordClient />
      <PdfOfficeToolEditorialV2 slug="pdf-para-word" />
    </>
  );
}
