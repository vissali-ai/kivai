import GirarPdfClient from "./girar-pdf-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("girar-pdf");

export default function Page() {
  return <GirarPdfClient />;
}
