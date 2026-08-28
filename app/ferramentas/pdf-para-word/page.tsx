import type { Metadata } from "next";

import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PdfParaWordClient from "./pdf-para-word-client";

const SEO_DESCRIPTION =
  "Converta o texto de PDFs digitais em DOCX editável, reconstruindo títulos, parágrafos, listas e quebras de página. Processamento local no navegador.";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getToolMetadataAsync("pdf-para-word");

  return {
    ...metadata,
    description: SEO_DESCRIPTION,
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, description: SEO_DESCRIPTION }
      : undefined,
    twitter: metadata.twitter
      ? { ...metadata.twitter, description: SEO_DESCRIPTION }
      : undefined,
  };
}

export default function PdfParaWordPage() {
  return (
    <>
      <PdfParaWordClient />
      <PdfOfficeToolEditorialV2 slug="pdf-para-word" />
    </>
  );
}
