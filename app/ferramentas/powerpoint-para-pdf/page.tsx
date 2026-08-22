import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PowerPointParaPdfClient from "./powerpoint-para-pdf-client";

export async function generateMetadata() { return getToolMetadataAsync("powerpoint-para-pdf"); }

export default function PowerPointParaPdfPage() {
  return (
    <>
      <PowerPointParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="powerpoint-para-pdf" />
    </>
  );
}
