import { getToolMetadata } from "@/lib/seo";
import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";

import ContadorDePalavrasClient from "./contador-de-palavras-client";

export const metadata = getToolMetadata("contador-de-palavras");

export default function ContadorDePalavrasPage() {
  return <><ContadorDePalavrasClient /><GeneralToolEditorial slug="contador-de-palavras" /></>;
}
