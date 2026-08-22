import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { customSystemsService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "Sistemas e Automações Personalizadas",
  description: "Sistemas internos, CRM simples, controles de estoque, pedidos, leads, orçamentos, agendas, painéis administrativos e ferramentas web personalizadas.",
  pathname: customSystemsService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("sistemas-e-automacoes-personalizadas"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function SistemasEAutomacoesPersonalizadasPage() {
  const override = await getPublishedSiteService("sistemas-e-automacoes-personalizadas");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={customSystemsService} />;
}
