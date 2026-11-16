import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const isStreaming = host === "streaming.kivai.com.br";

  return {
    id: "/",
    name: isStreaming ? "Streaming Kivai" : "Kivai | Ferramentas inteligentes",
    short_name: isStreaming ? "Streaming Kivai" : "Kivai",
    description: isStreaming
      ? "Ouça artistas independentes no Streaming Kivai."
      : "Suas ferramentas online para imagens, PDFs, marketing e produtividade em um só lugar.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#17151f",
    theme_color: "#17151f",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
