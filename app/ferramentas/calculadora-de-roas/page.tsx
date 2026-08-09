import CalculadoraDeRoasClient from "./calculadora-de-roas-client";
import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-roas");

export default function CalculadoraDeRoasPage() {
  return <><CalculadoraDeRoasClient /><GeneralToolEditorial slug="calculadora-de-roas" /></>;
}
