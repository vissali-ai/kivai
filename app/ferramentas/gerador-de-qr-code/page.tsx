import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import GeradorDeQrCodeClient from "./gerador-de-qr-code-client";

export const metadata = getToolMetadata("gerador-de-qr-code");

export default function GeradorDeQrCodePage() {
  return (
    <>
      <GeradorDeQrCodeClient />
      <ImageToolEditorialV2 slug="gerador-de-qr-code" />
    </>
  );
}
