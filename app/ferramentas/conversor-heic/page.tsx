import type { Metadata } from "next";

import ConversorHeicClient from "./conversor-heic-client";

export const metadata: Metadata = {
  title: "Conversor HEIC para JPG | Kivai",
  description:
    "Converta imagens HEIC do iPhone para JPG gratuitamente e diretamente no navegador.",
};

export default function ConversorHeicPage() {
  return (
    <main>
      <ConversorHeicClient />
    </main>
  );
}