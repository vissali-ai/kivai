import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import MontarPdfParaImpressaoClient from "./montar-pdf-para-impressao-client";

const baseMetadata = getToolMetadata("montar-pdf-para-impressao");

export const metadata = {
  ...baseMetadata,
  title: { absolute: "Montar PDF para Impressão Online | Kivai" },
};

export default function MontarPdfParaImpressaoPage() {
  return (
    <>
      <MontarPdfParaImpressaoClient />
      <PdfSpecialToolEditorialV2 slug="montar-pdf-para-impressao" />
    </>
  );
}
