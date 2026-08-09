import CalculadoraDeRoiClient from "./calculadora-de-roi-client";
import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-roi");

export default function CalculadoraDeRoiPage() {
  return <><CalculadoraDeRoiClient /><GeneralToolEditorial slug="calculadora-de-roi" /></>;
}
