import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CalculadoraDePorcentagemClient from "./calculadora-de-porcentagem-client";

const SEO_DESCRIPTION =
  "Calcule porcentagem de um valor, percentual entre valores, aumento, redução, acréscimo, desconto e valor original em oito modos online.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("calculadora-de-porcentagem");

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

export default function CalculadoraDePorcentagemPage() {
  return (
    <>
      <CalculadoraDePorcentagemClient />
      <CalculatorToolEditorialV2 slug="calculadora-de-porcentagem" />
    </>
  );
}
