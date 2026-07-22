import type { Metadata } from "next";

import CalculadoraDeRoiClient from "./calculadora-de-roi-client";

export const metadata: Metadata = {
  title: "Calculadora de ROI Grátis | Nexion Tools",
  description:
    "Calcule o retorno sobre investimento, descubra o ganho ou perda financeira e analise a rentabilidade do seu investimento.",
};

export default function CalculadoraDeRoiPage() {
  return <CalculadoraDeRoiClient />;
}