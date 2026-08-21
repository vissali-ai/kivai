"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

import type { CookieConsentPreferences } from "@/types/cookie-consent";

type ConsentedGoogleServicesProps = {
  pathname: string;
  preferences: CookieConsentPreferences | null;
};

/**
 * O Google Analytics continua sujeito à preferência analítica do Kivai.
 *
 * O script base do AdSense é carregado no layout para permitir que a CMP
 * certificada do Google funcione e interprete os sinais do Consent Mode.
 * A autorização para armazenamento, personalização e dados de publicidade
 * continua sendo controlada pelos sinais de consentimento.
 */
export function ConsentedGoogleServices({
  preferences,
}: ConsentedGoogleServicesProps) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return preferences?.analytics && gaId ? (
    <GoogleAnalytics gaId={gaId} />
  ) : null;
}
