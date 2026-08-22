import CalculadoraDeRoiClient from "./calculadora-de-roi-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("calculadora-de-roi"); }

export default function CalculadoraDeRoiPage() {
  return <><CalculadoraDeRoiClient /><CalculatorToolEditorialV2 slug="calculadora-de-roi" /></>;
}
