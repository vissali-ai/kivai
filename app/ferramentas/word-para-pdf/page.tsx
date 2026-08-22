import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import WordParaPdfClient from "./word-para-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("word-para-pdf"); }

export default function WordParaPdfPage() {
  return (
    <>
      <WordParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="word-para-pdf" />
    </>
  );
}
