import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { dashboardsService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Dashboards e Relatórios Personalizados",
  description: "Dashboards e relatórios para marketing, vendas, financeiro e operação, com indicadores personalizados, fontes integradas e atualização automatizada.",
  pathname: dashboardsService.pathname,
});

export default function DashboardsERelatoriosPage() {
  return <BusinessServicePage config={dashboardsService} />;
}
