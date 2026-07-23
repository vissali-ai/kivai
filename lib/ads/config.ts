import type { AdsConfig } from "./types";

/**
 * Configuração global do sistema de anúncios.
 *
 * Toda leitura de variáveis de ambiente deve acontecer aqui.
 */

export const adsConfig: AdsConfig = {
  provider:
    (process.env.NEXT_PUBLIC_AD_PROVIDER as AdsConfig["provider"]) ??
    "adsense",

  enabled:
    process.env.NEXT_PUBLIC_ADS_ENABLED !== "false",

  autoAds:
    process.env.NEXT_PUBLIC_ADSENSE_AUTO_ADS === "true",

  testMode:
    process.env.NODE_ENV !== "production",
};