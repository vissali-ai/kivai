import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { getToolMetadata } from "@/lib/seo";

import CalculadoraDePorcentagemClient from "./calculadora-de-porcentagem-client";

export const metadata = getToolMetadata("calculadora-de-porcentagem");

export default function CalculadoraDePorcentagemPage() {
  return <><CalculadoraDePorcentagemClient /><GeneralToolEditorial slug="calculadora-de-porcentagem" /></>;
}
