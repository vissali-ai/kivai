import type { Metadata } from "next";

import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PdfParaHtmlClient from "./pdf-para-html-client";

const accurateDescription =
  "Converta o texto extraível de PDFs digitais em HTML, com modo estruturado ou reposicionamento visual do texto. Não inclui OCR nem reconstrução de imagens.";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getToolMetadataAsync("pdf-para-html");
  return {
    ...base,
    description: accurateDescription,
    openGraph: base.openGraph ? { ...base.openGraph, description: accurateDescription } : undefined,
    twitter: base.twitter ? { ...base.twitter, description: accurateDescription } : undefined,
  };
}

export default function PdfParaHtmlPage() {
  return (
    <>
      <PdfParaHtmlClient />
      <PdfSpecialToolEditorialV2 slug="pdf-para-html" />
    </>
  );
}
