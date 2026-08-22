import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("contador-de-hashtags-instagram"); }

export default function Page() {
  return (
    <>
      <InstagramTextClient mode="hashtags" />
      <SocialToolEditorialV2 slug="contador-de-hashtags-instagram" />
    </>
  );
}
