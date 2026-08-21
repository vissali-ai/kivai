import type { Metadata } from "next";

import { ArchiveToolEditorial } from "@/components/tools/archive-tool-editorial";
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
      <ArchiveToolEditorial slug="descompactar-rar" />
    </>
  );
}
