import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { WatermarkClient } from "@/components/tools/watermark-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("adicionar-marca-dagua");

export default function AdicionarMarcaDaguaPage() {
  return (
    <>
      <WatermarkClient />
      <ImageToolEditorialV2 slug="adicionar-marca-dagua" />
    </>
  );
}
