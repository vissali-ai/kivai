import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas de Vídeo Online",
  description:
    "Converta, comprima, redimensione, recorte, gire, espelhe e divida vídeos, ajuste velocidade e volume, remova ou extraia áudio, capture frames e trabalhe com formatos como MP4, MOV, AVI e HEVC.",
  pathname: "/ferramentas/videos",
});
export async function generateMetadata() { return getCmsHubMetadata("videos", baseMetadata); }

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="videos" /></>;
}
