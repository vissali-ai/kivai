import type { Metadata } from "next";

import { TextToolEditorialV2 } from "@/components/tools/text-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import ContadorDePalavrasClient from "./contador-de-palavras-client";

const SEO_TITLE = "Contador de Palavras e Caracteres Online | Kivai";
const SEO_DESCRIPTION =
  "Conte palavras e caracteres com e sem espaços e acompanhe frases, parágrafos, linhas, tempo de leitura, tempo de fala e termos frequentes.";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getToolMetadataAsync("contador-de-palavras");

  return {
    ...metadata,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, title: SEO_TITLE, description: SEO_DESCRIPTION }
      : undefined,
    twitter: metadata.twitter
      ? { ...metadata.twitter, title: SEO_TITLE, description: SEO_DESCRIPTION }
      : undefined,
  };
}

export default function ContadorDePalavrasPage() {
  return (
    <>
      <ContadorDePalavrasClient />
      <TextToolEditorialV2 slug="contador-de-palavras" />
    </>
  );
}
