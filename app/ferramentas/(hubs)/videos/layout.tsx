import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para Vídeos",
  description: "Ferramentas online para editar, converter e otimizar vídeos no navegador.",
  pathname: "/ferramentas/videos",
});

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="videos" /></>;
}
