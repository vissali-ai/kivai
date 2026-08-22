import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import UnirPdfsClient from "./unir-pdfs-client";

export async function generateMetadata() { return getToolMetadataAsync("unir-pdfs"); }

export default function Page() {
  return (
    <>
      <UnirPdfsClient />
      <PdfToolEditorialV2 slug="unir-pdfs" />
    </>
  );
}
