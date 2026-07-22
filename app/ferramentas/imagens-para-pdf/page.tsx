import type { Metadata } from "next";

import ImagensParaPdfClient from "./imagens-para-pdf-client";

export const metadata: Metadata = {
  title: "Imagens para PDF Grátis | Nexion Tools",
  description:
    "Transforme imagens JPG, PNG e WebP em um único arquivo PDF diretamente no navegador.",
};

export default function ImagensParaPdfPage() {
  return <ImagensParaPdfClient />;
}