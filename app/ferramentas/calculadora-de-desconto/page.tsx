import CalculadoraDeDescontoClient from "./calculadora-de-desconto-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

const SEO_DESCRIPTION =
  "Calcule o valor economizado e o preço final após aplicar um desconto percentual entre 0% e 100% sobre o preço original.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("calculadora-de-desconto");

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

export default function CalculadoraDeDescontoPage() {
  return (
    <>
      <CalculadoraDeDescontoClient />
      <CalculatorToolEditorialV2 slug="calculadora-de-desconto" />
    </>
  );
}
