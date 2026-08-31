import type { Metadata } from "next";

import CalculadoraDeRoiClient from "./calculadora-de-roi-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

const description =
  "Calcule o ROI de um investimento, veja o ganho ou a perda em reais e interprete a rentabilidade percentual com base no retorno obtido.";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getToolMetadataAsync("calculadora-de-roi");

  return {
    ...base,
    description,
    openGraph: base.openGraph
      ? { ...base.openGraph, description }
      : undefined,
    twitter: base.twitter
      ? { ...base.twitter, description }
      : undefined,
  };
}

export default function CalculadoraDeRoiPage() {
  return (
    <>
      <CalculadoraDeRoiClient />
      <CalculatorToolEditorialV2 slug="calculadora-de-roi" />
    </>
  );
}
