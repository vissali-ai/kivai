import CalculadoraDeMargemClient from "./calculadora-de-margem-client";
import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-margem");

export default function CalculadoraDeMargemPage() {
  return <><CalculadoraDeMargemClient /><GeneralToolEditorial slug="calculadora-de-margem" /></>;
}
