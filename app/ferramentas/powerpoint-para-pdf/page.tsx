import type { Metadata } from "next";

import { PdfOfficeToolEditorialV2 } from "@/components/tools/pdf-office-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PowerPointParaPdfClient from "./powerpoint-para-pdf-client";

const SEO_DESCRIPTION =
  "Converta PPTX em PDF com prévia dos slides, seleção e reordenação da sequência, orientação, tamanho de página e qualidade ajustáveis.";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getToolMetadataAsync("powerpoint-para-pdf");

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

export default function PowerPointParaPdfPage() {
  return (
    <>
      <PowerPointParaPdfClient />
      <PdfOfficeToolEditorialV2 slug="powerpoint-para-pdf" />
    </>
  );
}
