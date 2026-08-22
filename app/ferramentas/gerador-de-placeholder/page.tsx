import { PlaceholderClient } from "@/components/tools/placeholder-client";
import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("gerador-de-placeholder"); }

export default function GeradorDePlaceholderPage() {
  return (
    <>
      <PlaceholderClient />
      <ImageToolEditorialV2 slug="gerador-de-placeholder" />
    </>
  );
}
