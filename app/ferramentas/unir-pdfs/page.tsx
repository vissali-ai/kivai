import UnirPdfsClient from "./unir-pdfs-client";
import { getToolMetadata } from "@/lib/seo";
import { PdfToolEditorial } from "@/components/tools/pdf-tool-editorial";

export const metadata = getToolMetadata("unir-pdfs");

export default function Page() {
  return <main><UnirPdfsClient /><PdfToolEditorial slug="unir-pdfs" /></main>;
}
