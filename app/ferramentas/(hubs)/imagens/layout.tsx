import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para Imagens",
  description: "Ferramentas online para editar, converter e otimizar imagens.",
  pathname: "/ferramentas/imagens",
});

export default function ImagensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="imagens" /></>;
}
