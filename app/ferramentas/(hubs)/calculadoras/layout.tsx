import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Calculadoras Online para Marketing, Vendas e Negócios",
  description: "Use calculadoras online de ROAS, ROI, markup, margem, desconto e porcentagem para analisar campanhas, preços, vendas e decisões financeiras.",
  pathname: "/ferramentas/calculadoras",
});
export async function generateMetadata() { return getCmsHubMetadata("calculadoras", baseMetadata); }

export default function CalculadorasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="calculadoras" /></>;
}
