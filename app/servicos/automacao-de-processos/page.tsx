import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { automationService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "Automação de Processos para Empresas",
  description: "Automação de processos, tarefas, relatórios e notificações com integração entre formulários, planilhas, CRM, WhatsApp e outras plataformas.",
  pathname: automationService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("automacao-de-processos"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function AutomacaoDeProcessosPage() {
  const override = await getPublishedSiteService("automacao-de-processos");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={automationService} />;
}
