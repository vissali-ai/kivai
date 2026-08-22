import CalculadoraDeMarkupClient from "./calculadora-de-markup-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("calculadora-de-markup"); }

export default function CalculadoraDeMarkupPage() {
  return <><CalculadoraDeMarkupClient /><CalculatorToolEditorialV2 slug="calculadora-de-markup" /></>;
}
