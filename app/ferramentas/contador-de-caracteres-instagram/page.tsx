import { ToolAiContent } from "@/components/tools/tool-ai-content";
import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("contador-de-caracteres-instagram"); }

export default function Page() {
  return (
    <>
      <ToolAiContent slug="contador-de-caracteres-instagram"><InstagramTextClient /></ToolAiContent>
      <SocialToolEditorialV2 slug="contador-de-caracteres-instagram" />
    </>
  );
}
