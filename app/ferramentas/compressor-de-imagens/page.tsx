import type { Metadata } from "next";

import CompressorDeImagensClient from "./compressor-de-imagens-client";

export const metadata: Metadata = {
  title: "Compressor de Imagens Online | Nexion Tools",
  description:
    "Comprima imagens JPG, PNG e WebP online, reduza o tamanho dos arquivos e preserve a qualidade visual com o Nexion Tools.",
};

export default function CompressorDeImagensPage() {
  return (
    <main>
      <CompressorDeImagensClient />
    </main>
  );
}
