import { PdfToolEditorialV2 } from "@/components/tools/pdf-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import GirarPdfClient from "./girar-pdf-client";

const SEO_DESCRIPTION =
  "Gire todas as páginas de um PDF em 90°, 180° ou 270° e baixe uma nova cópia com a orientação ajustada, diretamente no navegador.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("girar-pdf");

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
      <GirarPdfClient />
      <PdfToolEditorialV2 slug="girar-pdf" />
    </>
  );
}
