import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para Texto",
  description: "Ferramentas online para analisar, contar e formatar textos.",
  pathname: "/ferramentas/texto",
});

export default function TextoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="texto" /></>;
}
