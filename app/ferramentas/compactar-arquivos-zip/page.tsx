import type { Metadata } from "next";

import { ArchiveToolEditorialV2 } from "@/components/tools/archive-tool-editorial-v2";
import { SITE_URL } from "@/lib/seo";
import CompactarArquivosZipClient from "./compactar-arquivos-zip-client";

const title = "Compactar Arquivos em ZIP Online Grátis | Kivai";
const description =
  "Compacte vários arquivos em um único ZIP online, escolha o nível de compactação e faça o download diretamente no navegador, sem enviar seus arquivos ao servidor do Kivai.";
const url = `${SITE_URL}/ferramentas/compactar-arquivos-zip`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "compactar arquivos",
    "compactar zip",
    "criar zip online",
    "juntar arquivos em zip",
    "compactador zip online",
  ],
  alternates: { canonical: url },
  openGraph: { title, description, url, siteName: "Kivai", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function Page() {
  return (
    <>
      <CompactarArquivosZipClient />
      <ArchiveToolEditorialV2 slug="compactar-arquivos-zip" />
    </>
  );
}
