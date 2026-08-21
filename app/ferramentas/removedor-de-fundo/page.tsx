import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import RemovedorDeFundoClient from "./removedor-de-fundo-client";

export const metadata = getToolMetadata("removedor-de-fundo");

export default function RemovedorDeFundoPage() {
  return (
    <>
      <RemovedorDeFundoClient />
      <ImageToolEditorialV2 slug="removedor-de-fundo" />
    </>
  );
}
