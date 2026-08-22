import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import ConversorDeImagensClient from "./conversor-de-imagens-client";

export async function generateMetadata() { return getToolMetadataAsync("conversor-de-imagens"); }

export default function ConversorDeImagensPage() {
  return (
    <>
      <ConversorDeImagensClient />
      <ImageToolEditorialV2 slug="conversor-de-imagens" />
    </>
  );
}
