import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PdfParaWordClient from "./pdf-para-word-client";

export async function generateMetadata() { return getToolMetadataAsync("pdf-para-word"); }

export default function PdfParaWordPage() {
  return (
    <>
      <PdfParaWordClient />
      <PdfOfficeToolEditorialV2 slug="pdf-para-word" />
    </>
  );
}
