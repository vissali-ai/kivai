import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import DividirPdfClient from "./dividir-pdf-client";

const SEO_DESCRIPTION =
  "Separe todas as páginas de um PDF em arquivos individuais e baixe o resultado em um único ZIP, diretamente no navegador.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("dividir-pdf");

  return {
    ...metadata,
    description: SEO_DESCRIPTION,
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, description: SEO_DESCRIPTION }
      : metadata.openGraph,
    twitter: metadata.twitter
      ? { ...metadata.twitter, description: SEO_DESCRIPTION }
      : metadata.twitter,
  };
}

export default function Page() {
  return (
    <>
      <DividirPdfClient />
      <PdfToolEditorialV2 slug="dividir-pdf" />
    </>
  );
}
