import type { Metadata } from "next";

import CalculadoraDeMarkupClient from "./calculadora-de-markup-client";

export const metadata: Metadata = {
  title: "Calculadora de Markup Grátis | Nexion Tools",
  description:
    "Calcule o preço de venda com base no custo e no markup, descubra o lucro bruto e analise a margem resultante.",
};

export default function CalculadoraDeMarkupPage() {
  return <CalculadoraDeMarkupClient />;
}