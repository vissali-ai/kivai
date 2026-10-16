import type { Metadata } from "next";
import { getPageMetadata, noIndexRobots } from "@/lib/seo";
import AdsIntelligenceClient from "./ads-intelligence-client";

const base = getPageMetadata({
  title: "Ads Intelligence: planejamento e análise de Google Ads",
  description: "Monte um planejamento de tráfego pago e analise termos de pesquisa exportados do Google Ads, sem conectar a conta.",
  pathname: "/ferramentas/ads-intelligence",
});

export const metadata: Metadata = { ...base, robots: noIndexRobots };

export default function AdsIntelligencePage() {
  return <AdsIntelligenceClient />;
}
