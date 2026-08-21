import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Calculadoras Online para Marketing, Vendas e Negócios",
  description: "Use calculadoras online de ROAS, ROI, markup, margem, desconto e porcentagem para analisar campanhas, preços, vendas e decisões financeiras.",
  pathname: "/ferramentas/calculadoras",
});

export default function CalculadorasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="calculadoras" /></>;
}
