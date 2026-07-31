import ImagensParaPdfClient from "./imagens-para-pdf-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("imagens-para-pdf");

export default function ImagensParaPdfPage() {
  return <ImagensParaPdfClient />;
}
