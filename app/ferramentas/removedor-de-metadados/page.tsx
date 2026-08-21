import type { Metadata } from "next";

import { RemovedorMetadadosEditorial } from "@/components/tools/removedor-metadados-editorial";
import { getPageMetadata } from "@/lib/seo";
import RemovedorDeMetadadosClient from "./removedor-de-metadados-client";

export const metadata: Metadata = getPageMetadata({
  title: "Removedor de Metadados de Imagem Online",
  description:
    "Remova metadados herdados de imagens JPG, PNG e WebP diretamente no navegador e baixe uma nova cópia sem os dados incorporados do arquivo original.",
  pathname: "/ferramentas/removedor-de-metadados",
});

export default function RemovedorDeMetadadosPage() {
  return (
    <>
      <RemovedorDeMetadadosClient />
      <RemovedorMetadadosEditorial />
    </>
  );
}
