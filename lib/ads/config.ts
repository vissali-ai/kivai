import type { AdsConfig } from "./types";

/**
 * Configuração global do sistema de anúncios.
 *
 * Toda leitura de variáveis de ambiente deve acontecer aqui.
 */

const rawAdsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
const validAdsenseClient = /^ca-pub-\d{16}$/.test(rawAdsenseClient ?? "")
  ? (rawAdsenseClient as `ca-pub-${string}`)
  : null;

export const adsConfig: AdsConfig = {
  provider: "adsense",

  // Anúncios são opt-in também na configuração de implantação. A ausência da
  // variável nunca deve ativar publicidade acidentalmente.
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",

  clientId: validAdsenseClient,

  autoAds:
    process.env.NEXT_PUBLIC_ADSENSE_AUTO_ADS === "true",

  testMode:
    process.env.NODE_ENV !== "production",
};
