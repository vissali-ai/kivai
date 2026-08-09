import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("contador-de-hashtags-instagram");

export default function Page() {
  return <><InstagramTextClient mode="hashtags" /><GeneralToolEditorial slug="contador-de-hashtags-instagram" /></>;
}
