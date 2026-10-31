import { getToolMetadataAsync } from "@/lib/seo";
import type { Metadata } from "next";

import { ArchiveToolEditorialV2 } from "@/components/tools/archive-tool-editorial-v2";
import { getPageMetadata } from "@/lib/seo";
import DescompactarRarClient from "./descompactar-rar-client";

const baseMetadata: Metadata = getPageMetadata({
  title: "Descompactar RAR Online",
  description:
    "Abra e descompacte arquivos RAR online. Veja o conteúdo do RAR e baixe os arquivos extraídos.",
  pathname: "/ferramentas/descompactar-rar",
});

export async function generateMetadata() {
  return getToolMetadataAsync("descompactar-rar", baseMetadata);
}

export default function Page() {
  return (
    <>
      <DescompactarRarClient />
      <ArchiveToolEditorialV2 slug="descompactar-rar" />
    </>
  );
}
