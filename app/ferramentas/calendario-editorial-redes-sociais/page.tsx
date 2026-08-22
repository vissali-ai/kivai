import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import CalendarioEditorialClient from "./calendario-editorial-client";

export const metadata = getToolMetadata("calendario-editorial-redes-sociais");

export default function Page() {
  return (
    <>
      <CalendarioEditorialClient />
      <SocialToolEditorialV2 slug="calendario-editorial-redes-sociais" />
    </>
  );
}
