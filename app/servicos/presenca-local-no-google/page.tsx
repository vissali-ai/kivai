import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { googleLocalPresenceService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";

const fallbackMetadata = getPageMetadata({
  title: "Presença Local no Google e Perfil da Empresa",
  description: "Criação e otimização do Perfil da Empresa no Google com categorias, serviços, produtos, fotos, avaliações, publicações e acompanhamento.",
  pathname: googleLocalPresenceService.pathname,
});
export async function generateMetadata() { const item = await getPublishedSiteService("presenca-local-no-google"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

export default async function PresencaLocalNoGooglePage() {
  const override = await getPublishedSiteService("presenca-local-no-google");
  if (override) return <PublicServicePage service={override} />;
  return <BusinessServicePage config={googleLocalPresenceService} />;
}
