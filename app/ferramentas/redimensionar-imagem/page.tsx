import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

import RedimensionarImagemClient from "./redimensionar-imagem-client";

export const metadata = getToolMetadata("redimensionar-imagem");

export default function RedimensionarImagemPage() {
  return (
    <>
      <RedimensionarImagemClient />
      <ImageToolEditorial slug="redimensionar-imagem" />
    </>
  );
}
