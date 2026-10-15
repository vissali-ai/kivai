import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import { getPublishedToolOverride } from "@/lib/site-cms/repository";
import { assistantCopy, assistantSlugs } from "@/lib/ai/content-assistant-copy";

import CalendarioEditorialClient from "./calendario-editorial-client";

export async function generateMetadata() { return getToolMetadataAsync("calendario-editorial-redes-sociais"); }

export default async function Page() {
  const content = await getPublishedToolOverride(assistantSlugs.calendar);
  return (
    <>
      <CalendarioEditorialClient aiCopy={assistantCopy(assistantSlugs.calendar, content?.customData.originalFields)} />
      <SocialToolEditorialV2 slug="calendario-editorial-redes-sociais" />
    </>
  );
}
