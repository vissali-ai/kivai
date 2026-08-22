import CalculadoraDeMargemClient from "./calculadora-de-margem-client";
import { CalculatorToolEditorialV2 } from "@/components/tools/calculator-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("calculadora-de-margem"); }

export default function CalculadoraDeMargemPage() {
  return <><CalculadoraDeMargemClient /><CalculatorToolEditorialV2 slug="calculadora-de-margem" /></>;
}
