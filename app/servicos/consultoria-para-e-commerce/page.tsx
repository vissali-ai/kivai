import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { ecommerceConsultingService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Consultoria para E-commerce e Loja Virtual",
  description: "Consultoria para e-commerce em operação, catálogo, precificação, margem, conversão, marketplaces, estoque, marketing e indicadores.",
  pathname: ecommerceConsultingService.pathname,
});

export default function ConsultoriaParaEcommercePage() {
  return <BusinessServicePage config={ecommerceConsultingService} />;
}
