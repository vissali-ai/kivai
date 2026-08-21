import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import ConversorDeImagensClient from "./conversor-de-imagens-client";

export const metadata = getToolMetadata("conversor-de-imagens");

export default function ConversorDeImagensPage() {
  return (
    <>
      <ConversorDeImagensClient />
      <ImageToolEditorialV2 slug="conversor-de-imagens" />
    </>
  );
}
