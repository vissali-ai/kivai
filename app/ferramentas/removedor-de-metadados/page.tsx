import type { Metadata } from "next";

import { RemovedorMetadadosEditorial } from "@/components/tools/removedor-metadados-editorial";
import { removedorMetadadosTool } from "@/lib/removedor-metadados-tool";
import { getPageMetadata } from "@/lib/seo";
import RemovedorDeMetadadosClient from "./removedor-de-metadados-client";

export const metadata: Metadata = getPageMetadata({
  title: removedorMetadadosTool.seoTitle,
  description: removedorMetadadosTool.seoDescription,
  pathname: removedorMetadadosTool.href,
});

export default function RemovedorDeMetadadosPage() {
  return (
    <>
      <RemovedorDeMetadadosClient />
      <RemovedorMetadadosEditorial />
    </>
  );
}
