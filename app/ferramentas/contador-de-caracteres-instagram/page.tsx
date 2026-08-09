import { GeneralToolEditorial } from "@/components/tools/general-tool-editorial";
import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("contador-de-caracteres-instagram");

export default function Page() {
  return <><InstagramTextClient mode="characters" /><GeneralToolEditorial slug="contador-de-caracteres-instagram" /></>;
}
