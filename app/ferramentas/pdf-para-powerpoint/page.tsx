import type { Metadata } from "next";

import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PdfParaPowerPointClient from "./pdf-para-powerpoint-client";

const SEO_DESCRIPTION =
  "Converta páginas de PDF em slides PPTX com prévia, seleção e reordenação, formatos 16:9 ou 4:3 e qualidade de renderização ajustável.";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getToolMetadataAsync("pdf-para-powerpoint");

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

export default function PdfParaPowerPointPage() {
  return (
    <>
      <PdfParaPowerPointClient />
      <PdfOfficeToolEditorialV2 slug="pdf-para-powerpoint" />
    </>
  );
}
