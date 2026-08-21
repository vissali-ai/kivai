import CalculadoraDeRoasClient from "./calculadora-de-roas-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-roas");

export default function CalculadoraDeRoasPage() {
  return <><CalculadoraDeRoasClient /><CalculatorToolEditorialV2 slug="calculadora-de-roas" /></>;
}
