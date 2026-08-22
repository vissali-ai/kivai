import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import RelatorioSocialMediaClient from "./relatorio-client";

export async function generateMetadata() { return getToolMetadataAsync("gerador-de-relatorio-social-media"); }

export default function GeradorRelatorioSocialMediaPage() {
  return (
    <>
      <RelatorioSocialMediaClient />
      <SocialToolEditorialV2 slug="gerador-de-relatorio-social-media" />
    </>
  );
}
