import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CompressorDeImagensClient from "./compressor-de-imagens-client";

const SEO_DESCRIPTION =
  "Comprima imagens JPG, PNG e WebP online, reduza o tamanho do arquivo, mantenha as dimensões e compare a economia antes do download.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("compressor-de-imagens");

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

export default function CompressorDeImagensPage() {
  return (
    <>
      <CompressorDeImagensClient />
      <ImageToolEditorialV2 slug="compressor-de-imagens" />
    </>
  );
}
