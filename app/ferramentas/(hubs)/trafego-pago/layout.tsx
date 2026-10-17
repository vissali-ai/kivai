import type { Metadata } from "next";
import { TrafegoPagoHubEditorial } from "@/components/tools/trafego-pago-hub-editorial";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const fallback = getPageMetadata({
  title: "Tráfego Pago: planejamento, Google Ads e otimização",
  description: "Ferramentas para gestores de tráfego pago: análise de campanhas Google Ads, investimentos, conversões, metas, diagnósticos e calculadoras de ROAS e ROI.",
  pathname: "/ferramentas/trafego-pago",
});

export async function generateMetadata(): Promise<Metadata> {
  return getCmsHubMetadata("trafego-pago", fallback);
}

export default function TrafegoPagoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TrafegoPagoHubEditorial />
    </>
  );
}
