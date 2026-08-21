import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("contador-de-caracteres-instagram");

export default function Page() {
  return (
    <>
      <InstagramTextClient mode="characters" />
      <SocialToolEditorialV2 slug="contador-de-caracteres-instagram" />
    </>
  );
}
