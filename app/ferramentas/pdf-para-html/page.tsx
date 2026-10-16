import { ToolAiContent } from "@/components/tools/tool-ai-content";
import type { Metadata } from "next";

import { PdfSpecialToolEditorialV2 } from "@/components/tools/pdf-special-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PdfParaHtmlClient from "./pdf-para-html-client";

const accurateDescription =
  "Converta o texto extraível de PDFs digitais em HTML, com modo estruturado ou reposicionamento visual do texto. Modo opcional de IA para organizar páginas selecionadas, com revisão.";

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
      <ToolAiContent slug="pdf-para-html"><PdfParaHtmlClient /></ToolAiContent>
      <PdfSpecialToolEditorialV2 slug="pdf-para-html" />
    </>
  );
}
