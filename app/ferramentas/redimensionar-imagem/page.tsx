import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import RedimensionarImagemClient from "./redimensionar-imagem-client";

const SEO_DESCRIPTION =
  "Redimensione JPG, PNG, WebP, GIF e SVG por pixels ou porcentagem, processe várias imagens de uma vez e exporte em JPG, PNG ou WebP.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("redimensionar-imagem");

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

export default function RedimensionarImagemPage() {
  return (
    <>
      <RedimensionarImagemClient />
      <ImageToolEditorialV2 slug="redimensionar-imagem" />
    </>
  );
}
