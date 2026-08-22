import type { Metadata } from "next";

import { ArchiveToolEditorialV2 } from "@/components/tools/archive-tool-editorial-v2";
import { getPageMetadata } from "@/lib/seo";
import DescompactarRarClient from "./descompactar-rar-client";

export const metadata: Metadata = getPageMetadata({
  title: "Descompactar RAR Online",
  description:
    "Abra e descompacte arquivos RAR online no navegador. Veja o conteúdo do RAR e baixe os arquivos extraídos sem enviar o documento para nossos servidores.",
  pathname: "/ferramentas/descompactar-rar",
});

export default function Page() {
  return (
    <>
      <DescompactarRarClient />
      <ArchiveToolEditorialV2 slug="descompactar-rar" />
    </>
  );
}
