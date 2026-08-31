import type { Metadata } from "next";

import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CompactarPdfClient from "./compactar-pdf-client";

const accurateDescription =
  "Reduza o tamanho de arquivos PDF com otimização estrutural ou compactação por rasterização das páginas, diretamente no navegador.";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getToolMetadataAsync("compactar-pdf");

  return {
    ...base,
    description: accurateDescription,
    openGraph: base.openGraph ? { ...base.openGraph, description: accurateDescription } : undefined,
    twitter: base.twitter ? { ...base.twitter, description: accurateDescription } : undefined,
  };
}

export default function Page() {
  return (
    <>
      <CompactarPdfClient />
      <PdfToolEditorialV2 slug="compactar-pdf" />
    </>
  );
}
