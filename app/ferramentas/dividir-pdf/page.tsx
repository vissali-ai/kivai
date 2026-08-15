import DividirPdfClient from "./dividir-pdf-client";
import { getToolMetadata } from "@/lib/seo";
import { PdfToolEditorial } from "@/components/tools/pdf-tool-editorial";

export const metadata = getToolMetadata("dividir-pdf");

export default function Page() {
  return <><DividirPdfClient /><PdfToolEditorial slug="dividir-pdf" /></>;
}
