import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import { getPublishedToolOverride } from "@/lib/site-cms/repository";
import { assistantCopy, assistantSlugs } from "@/lib/ai/content-assistant-copy";

import PlanejadorClient from "./planejador-client";

export async function generateMetadata() { return getToolMetadataAsync("planejador-de-conteudo-social-media"); }

export default async function Page() {
  const content = await getPublishedToolOverride(assistantSlugs.planner);
  return (
    <>
      <PlanejadorClient aiCopy={assistantCopy(assistantSlugs.planner, content?.customData.originalFields)} />
      <SocialToolEditorialV2 slug="planejador-de-conteudo-social-media" />
    </>
  );
}
