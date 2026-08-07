"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

import { adsConfig } from "@/lib/ads/config";
import { isAdsenseEligiblePathname } from "@/lib/ads/eligibility";
import type { CookieConsentPreferences } from "@/types/cookie-consent";

type ConsentedGoogleServicesProps = {
  pathname: string;
  preferences: CookieConsentPreferences | null;
};

/**
 * Ponto único de carregamento das tags opcionais do Google.
 * Nenhum script é inserido antes de uma decisão explícita do visitante.
 */
export function ConsentedGoogleServices({
  pathname,
  preferences,
}: ConsentedGoogleServicesProps) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsenseClient = adsConfig.clientId;

  return (
    <>
      {preferences?.analytics && gaId ? <GoogleAnalytics gaId={gaId} /> : null}

      {preferences?.advertising &&
      adsConfig.enabled &&
      adsConfig.provider === "adsense" &&
      adsenseClient &&
      isAdsenseEligiblePathname(pathname) ? (
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
        />
      ) : null}
    </>
  );
}
