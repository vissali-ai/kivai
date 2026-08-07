import CompactarPdfClient from "./compactar-pdf-client";
import { getToolMetadata } from "@/lib/seo";
import { PdfToolEditorial } from "@/components/tools/pdf-tool-editorial";

export const metadata = getToolMetadata("compactar-pdf");

export default function Page() {
  return <main><CompactarPdfClient /><PdfToolEditorial slug="compactar-pdf" /></main>;
}
