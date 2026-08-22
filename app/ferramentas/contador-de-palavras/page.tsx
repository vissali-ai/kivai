import { TextToolEditorialV2 } from "@/components/tools/text-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import ContadorDePalavrasClient from "./contador-de-palavras-client";

export async function generateMetadata() { return getToolMetadataAsync("contador-de-palavras"); }

export default function ContadorDePalavrasPage() {
  return (
    <>
      <ContadorDePalavrasClient />
      <TextToolEditorialV2 slug="contador-de-palavras" />
    </>
  );
}
