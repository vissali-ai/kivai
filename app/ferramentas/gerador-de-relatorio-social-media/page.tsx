import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import RelatorioSocialMediaClient from "./relatorio-client";

export const metadata = getToolMetadata("gerador-de-relatorio-social-media");

export default function GeradorRelatorioSocialMediaPage() {
  return (
    <>
      <RelatorioSocialMediaClient />
      <SocialToolEditorialV2 slug="gerador-de-relatorio-social-media" />
    </>
  );
}
