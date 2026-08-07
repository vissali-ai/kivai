import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Calculadoras Online",
  description: "Calculadoras para campanhas, investimentos, margens, preços e descontos.",
  pathname: "/ferramentas/calculadoras",
});

export default function CalculadorasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="calculadoras" /></>;
}
