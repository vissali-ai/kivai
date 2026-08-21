import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import WordParaPdfClient from "./word-para-pdf-client";

export const metadata = getToolMetadata("word-para-pdf");

export default function WordParaPdfPage() {
  return (
    <>
      <WordParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="word-para-pdf" />
    </>
  );
}
