import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import RedimensionarImagemClient from "./redimensionar-imagem-client";

export const metadata = getToolMetadata("redimensionar-imagem");

export default function RedimensionarImagemPage() {
  return (
    <>
      <RedimensionarImagemClient />
      <ImageToolEditorialV2 slug="redimensionar-imagem" />
    </>
  );
}
