import { MockupGeneratorClient } from "@/components/tools/mockup-generator-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

export const metadata = getToolMetadata("gerador-de-mockups");

export default function GeradorDeMockupsPage() {
  return (
    <main>
      <MockupGeneratorClient />
      <ImageToolEditorial slug="gerador-de-mockups" />
    </main>
  );
}
