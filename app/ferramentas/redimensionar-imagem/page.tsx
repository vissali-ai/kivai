import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import RedimensionarImagemClient from "./redimensionar-imagem-client";

export async function generateMetadata() { return getToolMetadataAsync("redimensionar-imagem"); }

export default function RedimensionarImagemPage() {
  return (
    <>
      <RedimensionarImagemClient />
      <ImageToolEditorialV2 slug="redimensionar-imagem" />
    </>
  );
}
