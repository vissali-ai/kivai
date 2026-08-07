import { getToolMetadata } from "@/lib/seo";

import ConversorDeImagensClient from "./conversor-de-imagens-client";

export const metadata = getToolMetadata("conversor-de-imagens");

export default function ConversorDeImagensPage() {
  return (
    <main>
      <ConversorDeImagensClient />
    </main>
  );
}
