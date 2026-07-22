import type { Metadata } from "next";

import CalculadoraDeRoasClient from "./calculadora-de-roas-client";

export const metadata: Metadata = {
  title: "Calculadora de ROAS Grátis | Nexion Tools",
  description:
    "Calcule o ROAS das suas campanhas de anúncios, descubra a receita gerada por real investido e estime o ROAS de equilíbrio.",
};

export default function CalculadoraDeRoasPage() {
  return <CalculadoraDeRoasClient />;
}