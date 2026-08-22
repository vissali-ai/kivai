import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import RemovedorDeFundoClient from "./removedor-de-fundo-client";

export async function generateMetadata() { return getToolMetadataAsync("removedor-de-fundo"); }

export default function RemovedorDeFundoPage() {
  return (
    <>
      <RemovedorDeFundoClient />
      <ImageToolEditorialV2 slug="removedor-de-fundo" />
    </>
  );
}
