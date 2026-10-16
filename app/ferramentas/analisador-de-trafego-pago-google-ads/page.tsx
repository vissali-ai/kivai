import type { Metadata } from "next";
import { getPageMetadata, noIndexRobots } from "@/lib/seo";
import GoogleAdsTrafficAnalyzerClient from "./analisador-client";

const base = getPageMetadata({
  title: "Analisador de Tráfego Pago Google Ads",
  description: "Analise campanhas de tráfego pago Google Ads, compare resultados por tipo de campanha, planeje metas e revise termos de pesquisa exportados em CSV.",
  pathname: "/ferramentas/analisador-de-trafego-pago-google-ads",
});

// Manter não indexado até a implementação dos diagnósticos completos, documentação editorial e revisão de privacidade.
export const metadata: Metadata = { ...base, robots: noIndexRobots };

export default function AnalisadorDeTrafegoPagoGoogleAdsPage() {
  return <GoogleAdsTrafficAnalyzerClient />;
}
