import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { CropImageClient } from "@/components/tools/crop-image-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("recortar-imagem");

export default function RecortarImagemPage() {
  return (
    <>
      <CropImageClient />
      <ImageToolEditorialV2 slug="recortar-imagem" />
    </>
  );
}
