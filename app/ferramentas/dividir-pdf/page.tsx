import DividirPdfClient from "./dividir-pdf-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("dividir-pdf");

export default function Page() {
  return <DividirPdfClient />;
}
