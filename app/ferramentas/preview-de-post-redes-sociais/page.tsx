import { ToolAiContent } from "@/components/tools/tool-ai-content";
import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import PreviewClient from "./preview-client";

export async function generateMetadata() { return getToolMetadataAsync("preview-de-post-redes-sociais"); }

export default function Page() {
  return (
    <>
      <ToolAiContent slug="preview-de-post-redes-sociais"><PreviewClient /></ToolAiContent>
      <SocialToolEditorialV2 slug="preview-de-post-redes-sociais" />
    </>
  );
}
