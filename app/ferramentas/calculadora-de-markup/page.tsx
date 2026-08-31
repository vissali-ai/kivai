import type { Metadata } from "next";

import CalculadoraDeMarkupClient from "./calculadora-de-markup-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

const description =
  "Calcule o preço de venda com markup sobre o custo, veja o lucro bruto e compare a margem resultante para apoiar sua precificação.";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getToolMetadataAsync("calculadora-de-markup");

  return {
    ...base,
    description,
    openGraph: {
      ...base.openGraph,
      description,
    },
    twitter: {
      ...base.twitter,
      description,
    },
  };
}

export default function CalculadoraDeMarkupPage() {
  return (
    <>
      <CalculadoraDeMarkupClient />
      <CalculatorToolEditorialV2 slug="calculadora-de-markup" />
    </>
  );
}
