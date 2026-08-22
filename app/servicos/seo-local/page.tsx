import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { localSeoService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "SEO Local para Empresas e Negócios Locais",
  description: "Serviço de SEO local com páginas, palavras-chave geográficas, presença no Google, reputação, avaliações e acompanhamento de posicionamento.",
  pathname: localSeoService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("seo-local"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function SeoLocalPage() {
  const override = await getPublishedSiteService("seo-local");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={localSeoService} />;
}
