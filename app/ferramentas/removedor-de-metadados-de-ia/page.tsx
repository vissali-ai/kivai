import { getToolMetadataAsync } from "@/lib/seo";
import type { Metadata } from "next";

import { RemovedorMetadadosEditorial } from "@/components/tools/removedor-metadados-editorial";
import { removedorMetadadosTool } from "@/lib/removedor-metadados-tool";
import { getPageMetadata } from "@/lib/seo";
import RemovedorDeMetadadosClient from "../removedor-de-metadados/removedor-de-metadados-client";

const baseMetadata: Metadata = getPageMetadata({
  title: removedorMetadadosTool.seoTitle,
  description: removedorMetadadosTool.seoDescription,
  pathname: removedorMetadadosTool.href,
});

export async function generateMetadata() {
  return getToolMetadataAsync("removedor-de-metadados-de-ia", baseMetadata);
}

export default function RemovedorDeMetadadosDeIaPage() {
  return (
    <>
      <RemovedorDeMetadadosClient />
      <RemovedorMetadadosEditorial />
    </>
  );
}
