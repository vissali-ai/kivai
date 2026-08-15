import ImagensParaPdfClient from "./imagens-para-pdf-client";
import { getToolMetadata } from "@/lib/seo";
import { PdfToolEditorial } from "@/components/tools/pdf-tool-editorial";

export const metadata = getToolMetadata("imagens-para-pdf");

export default function ImagensParaPdfPage() {
  return <><ImagensParaPdfClient /><PdfToolEditorial slug="imagens-para-pdf" /></>;
}
