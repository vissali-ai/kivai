import type { Metadata } from "next";

import { ArchiveToolEditorial } from "@/components/tools/archive-tool-editorial";
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
      <ArchiveToolEditorial slug="renomear-arquivos-em-lote" />
    </>
  );
}
