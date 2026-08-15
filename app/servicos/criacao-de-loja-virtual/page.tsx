import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { virtualStoreService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Criação de Loja Virtual e E-commerce",
  description: "Criação de loja virtual com implantação, catálogo, pagamentos, integrações, Google Analytics, pixels e Google Merchant Center.",
  pathname: virtualStoreService.pathname,
});

export default function CriacaoDeLojaVirtualPage() {
  return <BusinessServicePage config={virtualStoreService} />;
}
