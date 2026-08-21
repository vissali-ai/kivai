import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import HtmlParaPdfClient from "./html-para-pdf-client";

export const metadata = getToolMetadata("html-para-pdf");

export default function HtmlParaPdfPage() {
  return (
    <>
      <HtmlParaPdfClient />
      <PdfSpecialToolEditorialV2 slug="html-para-pdf" />
    </>
  );
}
