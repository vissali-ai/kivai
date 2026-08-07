import RemovedorDeFundoClient from "./removedor-de-fundo-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

export const metadata = getToolMetadata("removedor-de-fundo");

export default function RemovedorDeFundoPage() {
  return (
    <main>
      <RemovedorDeFundoClient />
      <ImageToolEditorial slug="removedor-de-fundo" />
    </main>
  );
}
