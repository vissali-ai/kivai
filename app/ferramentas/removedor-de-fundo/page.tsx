import type { Metadata } from "next";

import RemovedorDeFundoClient from "./removedor-de-fundo-client";

export const metadata: Metadata = {
  title: "Removedor de Fundo Online | Nexion Tools",
  description:
    "Remova o fundo de imagens online de forma rápida e prática. Prepare fotos de produtos, anúncios e projetos com o Nexion Tools.",
};

export default function RemovedorDeFundoPage() {
  return (
    <main>
      <RemovedorDeFundoClient />
    </main>
  );
}
