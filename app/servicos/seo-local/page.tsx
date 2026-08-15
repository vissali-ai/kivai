import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { localSeoService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "SEO Local para Empresas e Negócios Locais",
  description: "Serviço de SEO local com páginas, palavras-chave geográficas, presença no Google, reputação, avaliações e acompanhamento de posicionamento.",
  pathname: localSeoService.pathname,
});

export default function SeoLocalPage() {
  return <BusinessServicePage config={localSeoService} />;
}
