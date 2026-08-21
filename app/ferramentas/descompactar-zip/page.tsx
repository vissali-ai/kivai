import type { Metadata } from "next";

import { ArchiveToolEditorial } from "@/components/tools/archive-tool-editorial";
import { SITE_URL } from "@/lib/seo";
import DescompactarZipClient from "./descompactar-zip-client";

const title = "Descompactar ZIP Online Grátis | Kivai";
const description =
  "Descompacte arquivos ZIP online, visualize o conteúdo e baixe os arquivos diretamente no navegador, sem enviar o ZIP para o servidor do Kivai.";
const url = `${SITE_URL}/ferramentas/descompactar-zip`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "descompactar zip",
    "abrir zip online",
    "extrair zip",
    "descompactar arquivo zip",
    "abrir arquivo zip",
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    siteName: "Kivai",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function Page() {
  return (
    <>
      <DescompactarZipClient />
      <ArchiveToolEditorial slug="descompactar-zip" />
    </>
  );
}
