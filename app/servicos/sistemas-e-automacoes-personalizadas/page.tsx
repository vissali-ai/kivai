import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { customSystemsService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Sistemas e Automações Personalizadas",
  description: "Sistemas internos, CRM simples, controles de estoque, pedidos, leads, orçamentos, agendas, painéis administrativos e ferramentas web personalizadas.",
  pathname: customSystemsService.pathname,
});

export default function SistemasEAutomacoesPersonalizadasPage() {
  return <BusinessServicePage config={customSystemsService} />;
}
