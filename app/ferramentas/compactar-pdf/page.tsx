import CompactarPdfClient from "./compactar-pdf-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("compactar-pdf");

export default function Page() {
  return <CompactarPdfClient />;
}
