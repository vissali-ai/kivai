import GirarPdfClient from "./girar-pdf-client";
import { getToolMetadata } from "@/lib/seo";
import { PdfToolEditorial } from "@/components/tools/pdf-tool-editorial";

export const metadata = getToolMetadata("girar-pdf");

export default function Page() {
  return <><GirarPdfClient /><PdfToolEditorial slug="girar-pdf" /></>;
}
