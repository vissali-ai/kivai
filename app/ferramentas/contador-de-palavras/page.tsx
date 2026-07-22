import type { Metadata } from "next";

import ContadorDePalavrasClient from "./contador-de-palavras-client";

export const metadata: Metadata = {
  title: "Contador de Palavras e Caracteres Grátis | Nexion Tools",
  description:
    "Conte palavras, caracteres, frases, parágrafos e linhas. Analise tempo de leitura, tempo de fala e limites de texto em tempo real.",
};

export default function ContadorDePalavrasPage() {
  return <ContadorDePalavrasClient />;
}