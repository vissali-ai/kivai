import CalculadoraDeMarkupClient from "./calculadora-de-markup-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-markup");

export default function CalculadoraDeMarkupPage() {
  return <><CalculadoraDeMarkupClient /><CalculatorToolEditorialV2 slug="calculadora-de-markup" /></>;
}
