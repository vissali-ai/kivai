import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CalculadoraEngajamentoClient from "./calculadora-client";

export async function generateMetadata() { return getToolMetadataAsync("calculadora-de-engajamento"); }

export default function Page() {
  return (
    <>
      <CalculadoraEngajamentoClient />
      <SocialToolEditorialV2 slug="calculadora-de-engajamento" />
    </>
  );
}
