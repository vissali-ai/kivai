import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { dashboardsService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "Dashboards e Relatórios Personalizados",
  description: "Dashboards e relatórios para marketing, vendas, financeiro e operação, com indicadores personalizados, fontes integradas e atualização automatizada.",
  pathname: dashboardsService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("dashboards-e-relatorios"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function DashboardsERelatoriosPage() {
  const override = await getPublishedSiteService("dashboards-e-relatorios");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={dashboardsService} />;
}
