import CalculadoraDeMarkupClient from "./calculadora-de-markup-client";
import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-markup");

export default function CalculadoraDeMarkupPage() {
  return <><CalculadoraDeMarkupClient /><GeneralToolEditorial slug="calculadora-de-markup" /></>;
}
