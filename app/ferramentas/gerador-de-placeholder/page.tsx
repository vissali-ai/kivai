import { PlaceholderClient } from "@/components/tools/placeholder-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("gerador-de-placeholder");
export default function GeradorDePlaceholderPage(){return <PlaceholderClient/>}
