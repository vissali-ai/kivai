import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import MontarPdfParaImpressaoClient from "./montar-pdf-para-impressao-client";

export async function generateMetadata() { return getToolMetadataAsync("montar-pdf-para-impressao"); }

export default function MontarPdfParaImpressaoPage() {
  return (
    <>
      <MontarPdfParaImpressaoClient />
      <PdfSpecialToolEditorialV2 slug="montar-pdf-para-impressao" />
    </>
  );
}
