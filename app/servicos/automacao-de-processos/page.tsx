import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { automationService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Automação de Processos para Empresas",
  description: "Automação de processos, tarefas, relatórios e notificações com integração entre formulários, planilhas, CRM, WhatsApp e outras plataformas.",
  pathname: automationService.pathname,
});

export default function AutomacaoDeProcessosPage() {
  return <BusinessServicePage config={automationService} />;
}
