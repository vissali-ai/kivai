import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PdfParaPowerPointClient from "./pdf-para-powerpoint-client";

export const metadata = getToolMetadata("pdf-para-powerpoint");

export default function PdfParaPowerPointPage() {
  return (
    <>
      <PdfParaPowerPointClient />
      <PdfOfficeToolEditorialV2 slug="pdf-para-powerpoint" />
    </>
  );
}
