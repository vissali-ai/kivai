import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas de Vídeo Online",
  description:
    "Converta, comprima, redimensione, recorte, gire, extraia áudio e faça outros ajustes em vídeos com ferramentas online gratuitas do Kivai.",
  pathname: "/ferramentas/videos",
});

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="videos" /></>;
}
