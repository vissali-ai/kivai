import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { ecommerceConsultingService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "Consultoria para E-commerce e Loja Virtual",
  description: "Consultoria para e-commerce em operação, catálogo, precificação, margem, conversão, marketplaces, estoque, marketing e indicadores.",
  pathname: ecommerceConsultingService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("consultoria-para-e-commerce"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function ConsultoriaParaEcommercePage() {
  const override = await getPublishedSiteService("consultoria-para-e-commerce");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={ecommerceConsultingService} />;
}
