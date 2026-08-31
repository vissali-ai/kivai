import type { Metadata } from "next";

import CalculadoraDeRoasClient from "./calculadora-de-roas-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

const SEO_DESCRIPTION =
  "Calcule o ROAS da campanha pela receita e pelo investimento em anúncios e estime o ROAS de equilíbrio usando a margem de contribuição.";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getToolMetadataAsync("calculadora-de-roas");

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

export default function CalculadoraDeRoasPage() {
  return (
    <>
      <CalculadoraDeRoasClient />
      <CalculatorToolEditorialV2 slug="calculadora-de-roas" />
    </>
  );
}
