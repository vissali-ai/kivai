import { SocialToolEditorialV2 } from "@/components/tools/social-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import PreviewClient from "./preview-client";

export const metadata = getToolMetadata("preview-de-post-redes-sociais");

export default function Page() {
  return (
    <>
      <PreviewClient />
      <SocialToolEditorialV2 slug="preview-de-post-redes-sociais" />
    </>
  );
}
