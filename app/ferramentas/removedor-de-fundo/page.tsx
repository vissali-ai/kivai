import RemovedorDeFundoClient from "./removedor-de-fundo-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("removedor-de-fundo");

export default function RemovedorDeFundoPage() {
  return (
    <main>
      <RemovedorDeFundoClient />
    </main>
  );
}