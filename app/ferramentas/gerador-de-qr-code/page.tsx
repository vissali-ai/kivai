import type { Metadata } from "next";

import GeradorDeQrCodeClient from "./gerador-de-qr-code-client";

export const metadata: Metadata = {
  title: "Gerador de QR Code Grátis | Nexion Tools",
  description:
    "Crie QR Codes personalizados para links, textos, WhatsApp, telefone, e-mail e Wi-Fi. Gere e baixe em PNG ou SVG.",
};

export default function GeradorDeQrCodePage() {
  return <GeradorDeQrCodeClient />;
}