import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import RedimensionarPdfClient from "./redimensionar-pdf-client";

const toolMetadata = getToolMetadata("redimensionar-pdf");

export const metadata = {
  ...toolMetadata,
  title: { absolute: "Redimensionar PDF para A4, A3, A5 e outros | Kivai" },
};

export default function RedimensionarPdfPage() {
  return (
    <>
      <RedimensionarPdfClient />
      <PdfSpecialToolEditorialV2 slug="redimensionar-pdf" />
    </>
  );
}
