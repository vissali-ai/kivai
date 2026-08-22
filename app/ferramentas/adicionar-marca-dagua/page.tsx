import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { WatermarkClient } from "@/components/tools/watermark-client";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("adicionar-marca-dagua"); }

export default function AdicionarMarcaDaguaPage() {
  return (
    <>
      <WatermarkClient />
      <ImageToolEditorialV2 slug="adicionar-marca-dagua" />
    </>
  );
}
