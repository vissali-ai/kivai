import { TextToolEditorialV2 } from "@/components/tools/text-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import ContadorDePalavrasClient from "./contador-de-palavras-client";

export const metadata = getToolMetadata("contador-de-palavras");

export default function ContadorDePalavrasPage() {
  return (
    <>
      <ContadorDePalavrasClient />
      <TextToolEditorialV2 slug="contador-de-palavras" />
    </>
  );
}
