import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import CalculadoraDePorcentagemClient from "./calculadora-de-porcentagem-client";

export const metadata = getToolMetadata("calculadora-de-porcentagem");

export default function CalculadoraDePorcentagemPage() {
  return <><CalculadoraDePorcentagemClient /><CalculatorToolEditorialV2 slug="calculadora-de-porcentagem" /></>;
}
