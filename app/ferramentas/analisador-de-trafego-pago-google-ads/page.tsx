import type { Metadata } from "next";
import { getPageMetadata, noIndexRobots } from "@/lib/seo";
import GoogleAdsTrafficAnalyzerClient from "./analisador-client";
import { ToolSeoDisclosure } from "@/components/tools/tool-seo-disclosure";
import { GoogleAdsAnalyzerEditorial } from "@/components/tools/google-ads-analyzer-editorial";

const base = getPageMetadata({
  title: "Analisador de Tráfego Pago Google Ads",
  description: "Analise campanhas Google Ads, compare investimento, conversões e metas, identifique prioridades e oportunidades de otimização com contas conectadas ou relatórios CSV.",
  pathname: "/ferramentas/analisador-de-trafego-pago-google-ads",
});

// Manter não indexado até a implementação dos diagnósticos completos, documentação editorial e revisão de privacidade.
export const metadata: Metadata = { ...base, robots: noIndexRobots };

export default function AnalisadorDeTrafegoPagoGoogleAdsPage() {
  return <><GoogleAdsTrafficAnalyzerClient /><div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8"><ToolSeoDisclosure title="Guia e informações da ferramenta"><GoogleAdsAnalyzerEditorial /></ToolSeoDisclosure></div></>;
}
