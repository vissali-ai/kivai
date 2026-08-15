import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { googleLocalPresenceService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Presença Local no Google e Perfil da Empresa",
  description: "Criação e otimização do Perfil da Empresa no Google com categorias, serviços, produtos, fotos, avaliações, publicações e acompanhamento.",
  pathname: googleLocalPresenceService.pathname,
});

export default function PresencaLocalNoGooglePage() {
  return <BusinessServicePage config={googleLocalPresenceService} />;
}
