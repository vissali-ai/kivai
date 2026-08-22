import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import HtmlParaPdfClient from "./html-para-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("html-para-pdf"); }

export default function HtmlParaPdfPage() {
  return (
    <>
      <HtmlParaPdfClient />
      <PdfSpecialToolEditorialV2 slug="html-para-pdf" />
    </>
  );
}
