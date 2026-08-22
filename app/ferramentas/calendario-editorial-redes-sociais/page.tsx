import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import CalendarioEditorialClient from "./calendario-editorial-client";

export async function generateMetadata() { return getToolMetadataAsync("calendario-editorial-redes-sociais"); }

export default function Page() {
  return (
    <>
      <CalendarioEditorialClient />
      <SocialToolEditorialV2 slug="calendario-editorial-redes-sociais" />
    </>
  );
}
