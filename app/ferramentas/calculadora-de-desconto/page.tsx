import CalculadoraDeDescontoClient from "./calculadora-de-desconto-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-desconto");

export default function CalculadoraDeDescontoPage() {
  return <><CalculadoraDeDescontoClient /><CalculatorToolEditorialV2 slug="calculadora-de-desconto" /></>;
}
