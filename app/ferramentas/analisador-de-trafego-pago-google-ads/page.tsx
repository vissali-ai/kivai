import type { Metadata } from "next";
import { getPageMetadata, noIndexRobots } from "@/lib/seo";
import GoogleAdsTrafficAnalyzerClient from "./analisador-client";
import { GoogleAdsAnalyzerEditorial } from "@/components/tools/google-ads-analyzer-editorial";

const base = getPageMetadata({
  title: "Analisador de Tráfego Pago Google Ads",
  description: "Analise campanhas Google Ads, compare investimento, conversões e metas, identifique prioridades e oportunidades de otimização com contas conectadas ou relatórios CSV.",
  pathname: "/ferramentas/analisador-de-trafego-pago-google-ads",
});

// Manter não indexado até a implementação dos diagnósticos completos, documentação editorial e revisão de privacidade.
export const metadata: Metadata = { ...base, robots: noIndexRobots };

export default function AnalisadorDeTrafegoPagoGoogleAdsPage() {
  return <><GoogleAdsTrafficAnalyzerClient /><GoogleAdsAnalyzerEditorial /></>;
}
