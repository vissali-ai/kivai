import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PlanejadorClient from "./planejador-client";

export const metadata = getToolMetadata("planejador-de-conteudo-social-media");

export default function Page() {
  return (
    <>
      <PlanejadorClient />
      <SocialToolEditorialV2 slug="planejador-de-conteudo-social-media" />
    </>
  );
}
