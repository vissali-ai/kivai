import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PowerPointParaPdfClient from "./powerpoint-para-pdf-client";

export const metadata = getToolMetadata("powerpoint-para-pdf");

export default function PowerPointParaPdfPage() {
  return (
    <>
      <PowerPointParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="powerpoint-para-pdf" />
    </>
  );
}
