import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("quebra-de-linha-instagram");

export default function Page() {
  return (
    <>
      <InstagramTextClient mode="lines" />
      <SocialToolEditorialV2 slug="quebra-de-linha-instagram" />
    </>
  );
}
