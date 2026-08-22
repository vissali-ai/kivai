import type { Metadata } from "next";

import { ArchiveToolEditorialV2 } from "@/components/tools/archive-tool-editorial-v2";
import { getPageMetadata } from "@/lib/seo";
import RenomearArquivosEmLoteClient from "./renomear-arquivos-em-lote-client";

export const metadata: Metadata = getPageMetadata({
  title: "Renomear Arquivos em Lote Online",
  description:
    "Renomeie vários arquivos de uma vez, aplique nome base e numeração automática e baixe as cópias organizadas em ZIP diretamente no navegador.",
  pathname: "/ferramentas/renomear-arquivos-em-lote",
});

export default function Page() {
  return (
    <>
      <RenomearArquivosEmLoteClient />
      <ArchiveToolEditorialV2 slug="renomear-arquivos-em-lote" />
    </>
  );
}
