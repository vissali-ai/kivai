import { getToolMetadata } from "@/lib/seo";

import ContadorDePalavrasClient from "./contador-de-palavras-client";

export const metadata = getToolMetadata("contador-de-palavras");

export default function ContadorDePalavrasPage() {
  return <ContadorDePalavrasClient />;
}
