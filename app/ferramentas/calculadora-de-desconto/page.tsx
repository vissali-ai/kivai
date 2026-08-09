import CalculadoraDeDescontoClient from "./calculadora-de-desconto-client";
import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-desconto");

export default function CalculadoraDeDescontoPage() {
  return <><CalculadoraDeDescontoClient /><GeneralToolEditorial slug="calculadora-de-desconto" /></>;
}
