import type { Metadata } from "next";

import CalculadoraDePorcentagemClient from "./calculadora-de-porcentagem-client";

export const metadata: Metadata = {
  title: "Calculadora de Porcentagem Grátis | Nexion Tools",
  description:
    "Calcule porcentagens, aumentos, descontos, variações percentuais e descubra quanto um valor representa em relação ao outro.",
};

export default function CalculadoraDePorcentagemPage() {
  return <CalculadoraDePorcentagemClient />;
}