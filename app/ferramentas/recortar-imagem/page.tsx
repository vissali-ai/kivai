import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { CropImageClient } from "@/components/tools/crop-image-client";
import { getToolMetadataAsync } from "@/lib/seo";

const SEO_TITLE = "Recortar Imagem Online com Seleção Visual | Kivai";
const SEO_DESCRIPTION =
  "Recorte imagens PNG, JPG e WebP com seleção visual, ajuste por pixels e proporções prontas como 1:1, 4:5, 3:2 e 16:9.";

export async function generateMetadata() {
  const metadata = await getToolMetadataAsync("recortar-imagem");

  return {
    ...metadata,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, title: SEO_TITLE, description: SEO_DESCRIPTION }
      : metadata.openGraph,
    twitter: metadata.twitter
      ? { ...metadata.twitter, title: SEO_TITLE, description: SEO_DESCRIPTION }
      : metadata.twitter,
  };
}

export default function RecortarImagemPage() {
  return (
    <>
      <CropImageClient />
      <ImageToolEditorialV2 slug="recortar-imagem" />
    </>
  );
}
