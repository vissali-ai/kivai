import { getToolMetadata } from "@/lib/seo";

import RedimensionarImagemClient from "./redimensionar-imagem-client";

export const metadata = getToolMetadata("redimensionar-imagem");

export default function RedimensionarImagemPage() {
  return (
    <main>
      <RedimensionarImagemClient />
    </main>
  );
}
