import type { Metadata } from "next";

import RedimensionarImagemClient from "./redimensionar-imagem-client";

export const metadata: Metadata = {
  title: "Redimensionar Imagem Online | Kivai",
  description:
    "Redimensione imagens JPG, PNG e WebP gratuitamente. Ajuste largura, altura e mantenha a proporção diretamente no navegador.",
};

export default function RedimensionarImagemPage() {
  return (
    <main>
      <RedimensionarImagemClient />
    </main>
  );
}