import PdfParaImagensClient from "./pdf-para-imagens-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("pdf-para-imagens");

export default function Page() {
  return <PdfParaImagensClient />;
}
