import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kivai | Ferramentas inteligentes",
    short_name: "Kivai",
    description: "Suas ferramentas online para imagens, PDFs, marketing e produtividade em um só lugar.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#17151f",
    theme_color: "#17151f",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
