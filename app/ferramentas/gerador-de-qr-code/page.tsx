import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

import GeradorDeQrCodeClient from "./gerador-de-qr-code-client";

export const metadata = getToolMetadata("gerador-de-qr-code");

export default function GeradorDeQrCodePage() {
  return (
    <>
      <GeradorDeQrCodeClient />
      <ImageToolEditorial slug="gerador-de-qr-code" />
    </>
  );
}
