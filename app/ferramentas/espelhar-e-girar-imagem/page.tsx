import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { TransformImageClient } from "@/components/tools/transform-image-client";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("espelhar-e-girar-imagem"); }

export default function EspelharEGirarImagemPage() {
  return (
    <>
      <TransformImageClient />
      <ImageToolEditorialV2 slug="espelhar-e-girar-imagem" />
    </>
  );
}
