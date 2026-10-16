import type { Metadata } from "next";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const fallback = getPageMetadata({
  title: "Tráfego Pago: planejamento, Google Ads e otimização",
  description: "Ferramentas para gestores de tráfego pago: planejamento mensal, análise de campanhas Google Ads, ROAS, ROI e revisão de termos de pesquisa.",
  pathname: "/ferramentas/trafego-pago",
});

export async function generateMetadata(): Promise<Metadata> {
  return getCmsHubMetadata("trafego-pago", fallback);
}

export default function TrafegoPagoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
