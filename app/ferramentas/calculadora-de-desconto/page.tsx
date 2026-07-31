import CalculadoraDeDescontoClient from "./calculadora-de-desconto-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-desconto");

export default function CalculadoraDeDescontoPage() {
  return <CalculadoraDeDescontoClient />;
}
