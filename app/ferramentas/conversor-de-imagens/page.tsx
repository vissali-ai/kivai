import type { Metadata } from "next";

import ConversorDeImagensClient from "./conversor-de-imagens-client";

export const metadata: Metadata = {
  title: "Conversor de Imagens PNG, JPG e WebP | Nexion Tools",
  description:
    "Converta imagens online entre PNG, JPG e WebP com controle de qualidade e processamento prático no Nexion Tools.",
};

export default function ConversorDeImagensPage() {
  return (
    <main>
      <ConversorDeImagensClient />
    </main>
  );
}
