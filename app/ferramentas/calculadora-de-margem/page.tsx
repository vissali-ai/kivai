import type { Metadata } from "next";

import CalculadoraDeMargemClient from "./calculadora-de-margem-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

const description =
  "Calcule a margem percentual sobre o preço de venda, veja o lucro ou prejuízo por unidade e compare cenários de rentabilidade com base no custo total.";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getToolMetadataAsync("calculadora-de-margem");

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

export default function CalculadoraDeMargemPage() {
  return (
    <>
      <CalculadoraDeMargemClient />
      <CalculatorToolEditorialV2 slug="calculadora-de-margem" />
    </>
  );
}
