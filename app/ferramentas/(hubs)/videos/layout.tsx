import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas de Vídeo Online",
  description:
    "Converta, comprima, redimensione, recorte, gire, extraia áudio e faça outros ajustes em vídeos com ferramentas online gratuitas do Kivai.",
  pathname: "/ferramentas/videos",
});
export async function generateMetadata() { return getCmsHubMetadata("videos", baseMetadata); }

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="videos" /></>;
}
