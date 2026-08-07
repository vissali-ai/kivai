import PdfParaImagensClient from "./pdf-para-imagens-client";
import { getToolMetadata } from "@/lib/seo";
import { PdfToolEditorial } from "@/components/tools/pdf-tool-editorial";

export const metadata = getToolMetadata("pdf-para-imagens");

export default function Page() {
  return <main><PdfParaImagensClient /><PdfToolEditorial slug="pdf-para-imagens" /></main>;
}
