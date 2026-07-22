import type { Metadata } from "next";

import RemovedorDeFundoClient from "./removedor-de-fundo-client";

export const metadata: Metadata = {
  title: "Removedor de Fundo Online Grátis | Kivai",

  description:
    "Remova o fundo de imagens automaticamente e online. Ferramenta gratuita para criar imagens com fundo transparente em segundos.",

  alternates: {
    canonical: "https://kivai.com.br/ferramentas/removedor-de-fundo",
  },

  openGraph: {
    title: "Removedor de Fundo Online Grátis | Kivai",
    description:
      "Remova o fundo de imagens automaticamente e online. Ferramenta gratuita para criar imagens com fundo transparente em segundos.",
    url: "https://kivai.com.br/ferramentas/removedor-de-fundo",
    siteName: "Kivai",
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Removedor de Fundo Online Grátis | Kivai",
    description:
      "Remova o fundo de imagens automaticamente e online. Ferramenta gratuita para criar imagens com fundo transparente em segundos.",
  },
};

export default function RemovedorDeFundoPage() {
  return (
    <main>
      <RemovedorDeFundoClient />
    </main>
  );
}
