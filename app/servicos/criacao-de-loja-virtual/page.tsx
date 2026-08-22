import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { virtualStoreService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "Criação de Loja Virtual e E-commerce",
  description: "Criação de loja virtual com implantação, catálogo, pagamentos, integrações, Google Analytics, pixels e Google Merchant Center.",
  pathname: virtualStoreService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("criacao-de-loja-virtual"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function CriacaoDeLojaVirtualPage() {
  const override = await getPublishedSiteService("criacao-de-loja-virtual");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={virtualStoreService} />;
}
