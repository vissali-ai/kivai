import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import CalculadoraEngajamentoClient from "./calculadora-client";

export const metadata = getToolMetadata("calculadora-de-engajamento");

export default function Page() {
  return (
    <>
      <CalculadoraEngajamentoClient />
      <SocialToolEditorialV2 slug="calculadora-de-engajamento" />
    </>
  );
}
