import CalculadoraDeDescontoClient from "./calculadora-de-desconto-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("calculadora-de-desconto"); }

export default function CalculadoraDeDescontoPage() {
  return <><CalculadoraDeDescontoClient /><CalculatorToolEditorialV2 slug="calculadora-de-desconto" /></>;
}
