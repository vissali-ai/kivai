import type { Metadata } from "next";

import { ArchiveToolEditorialV2 } from "@/components/tools/archive-tool-editorial-v2";
import { getPageMetadata } from "@/lib/seo";
import AdicionarPrefixoSufixoArquivosClient from "./adicionar-prefixo-sufixo-arquivos-client";

export const metadata: Metadata = getPageMetadata({
  title: "Adicionar Prefixo ou Sufixo em Arquivos Online",
  description:
    "Adicione prefixo ou sufixo a vários arquivos de uma vez, preserve os nomes e extensões e baixe as cópias modificadas em ZIP.",
  pathname: "/ferramentas/adicionar-prefixo-sufixo-arquivos",
});

export default function Page() {
  return (
    <>
      <AdicionarPrefixoSufixoArquivosClient />
      <ArchiveToolEditorialV2 slug="adicionar-prefixo-sufixo-arquivos" />
    </>
  );
}
