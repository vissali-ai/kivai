import type { Metadata } from "next";

import CalculadoraDeMargemClient from "./calculadora-de-margem-client";

export const metadata: Metadata = {
  title: "Calculadora de Margem Grátis | Nexion Tools",
  description:
    "Calcule a margem de lucro, descubra o lucro ou prejuízo por venda e analise a rentabilidade da sua operação.",
};

export default function CalculadoraDeMargemPage() {
  return <CalculadoraDeMargemClient />;
}