import CalculadoraDeRoasClient from "./calculadora-de-roas-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("calculadora-de-roas"); }

export default function CalculadoraDeRoasPage() {
  return <><CalculadoraDeRoasClient /><CalculatorToolEditorialV2 slug="calculadora-de-roas" /></>;
}
