import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PdfParaHtmlClient from "./pdf-para-html-client";

export const metadata = getToolMetadata("pdf-para-html");

export default function PdfParaHtmlPage() {
  return (
    <>
      <PdfParaHtmlClient />
      <PdfSpecialToolEditorialV2 slug="pdf-para-html" />
    </>
  );
}
