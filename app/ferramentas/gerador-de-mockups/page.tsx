import { MockupGeneratorClient } from "@/components/tools/mockup-generator-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("gerador-de-mockups");

export default function GeradorDeMockupsPage() {
  return (
    <MockupGeneratorClient />
  );
}
