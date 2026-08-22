import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { CropImageClient } from "@/components/tools/crop-image-client";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("recortar-imagem"); }

export default function RecortarImagemPage() {
  return (
    <>
      <CropImageClient />
      <ImageToolEditorialV2 slug="recortar-imagem" />
    </>
  );
}
