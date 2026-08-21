import { FaviconGeneratorClient } from "@/components/tools/favicon-generator-client";
import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("imagem-para-favicon");

export default function ImagemParaFaviconPage() {
  return (
    <>
      <FaviconGeneratorClient
        title="Imagem para Favicon"
        description="Transforme uma imagem em favicons prontos para navegador, Apple e Android."
        showAll={false}
        names={{
          16: "favicon-16x16.png",
          32: "favicon-32x32.png",
          180: "apple-touch-icon.png",
          192: "android-chrome-192x192.png",
          512: "android-chrome-512x512.png",
        }}
      />
      <ImageToolEditorialV2 slug="imagem-para-favicon" />
    </>
  );
}
