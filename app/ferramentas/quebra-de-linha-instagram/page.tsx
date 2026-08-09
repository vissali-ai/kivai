import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("quebra-de-linha-instagram");

export default function Page() {
  return <><InstagramTextClient mode="lines" /><GeneralToolEditorial slug="quebra-de-linha-instagram" /></>;
}
