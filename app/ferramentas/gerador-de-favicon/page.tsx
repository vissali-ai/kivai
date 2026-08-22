import { FaviconGeneratorClient } from "@/components/tools/favicon-generator-client";
import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("gerador-de-favicon"); }

export default function GeradorDeFaviconPage() {
  return (
    <>
      <FaviconGeneratorClient
        title="Gerador de Favicon"
        description="Crie um pacote de favicons para seu site."
        showAll
        names={{
          16: "favicon-16x16.png",
          32: "favicon-32x32.png",
          48: "favicon-48x48.png",
          64: "favicon-64x64.png",
          180: "apple-touch-icon.png",
          192: "android-chrome-192x192.png",
          512: "android-chrome-512x512.png",
        }}
      />
      <ImageToolEditorialV2 slug="gerador-de-favicon" />
    </>
  );
}
