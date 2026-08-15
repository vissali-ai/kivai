import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

import ConversorDeImagensClient from "./conversor-de-imagens-client";

export const metadata = getToolMetadata("conversor-de-imagens");

export default function ConversorDeImagensPage() {
  return (
    <>
      <ConversorDeImagensClient />
      <ImageToolEditorial slug="conversor-de-imagens" />
    </>
  );
}
