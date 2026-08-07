import { getToolMetadata } from "@/lib/seo";

import ConversorHeicClient from "./conversor-heic-client";

export const metadata = getToolMetadata("conversor-heic");

export default function ConversorHeicPage() {
  return (
    <main>
      <ConversorHeicClient />
    </main>
  );
}
