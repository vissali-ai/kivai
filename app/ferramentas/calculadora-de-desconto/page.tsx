import type { Metadata } from "next";

import CalculadoraDeDescontoClient from "./calculadora-de-desconto-client";

export const metadata: Metadata = {
  title: "Calculadora de Desconto Grátis | Nexion Tools",
  description:
    "Calcule descontos percentuais, descubra o valor economizado e veja o preço final de produtos e serviços.",
};

export default function CalculadoraDeDescontoPage() {
  return <CalculadoraDeDescontoClient />;
}