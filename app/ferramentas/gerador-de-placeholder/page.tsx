import { PlaceholderClient } from "@/components/tools/placeholder-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";
export const metadata = getToolMetadata("gerador-de-placeholder");
export default function GeradorDePlaceholderPage(){return <main><PlaceholderClient/><ImageToolEditorial slug="gerador-de-placeholder" /></main>}
