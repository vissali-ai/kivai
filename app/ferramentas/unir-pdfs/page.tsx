import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import UnirPdfsClient from "./unir-pdfs-client";

export const metadata = getToolMetadata("unir-pdfs");

export default function Page() {
  return (
    <>
      <UnirPdfsClient />
      <PdfToolEditorialV2 slug="unir-pdfs" />
    </>
  );
}
