"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { COOKIE_CONSENT_VERSION, readCookieConsent, saveCookieConsent } from "@/lib/cookie-consent";
import { removeKnownGoogleAnalyticsCookies, updateGoogleConsent } from "@/lib/google-consent";
import type { CookieConsentPreferences } from "@/types/cookie-consent";
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner";
import { CookiePreferencesDialog } from "@/components/privacy/cookie-preferences-dialog";

type ConsentContextValue = {
  preferences: CookieConsentPreferences | null;
  hasDecision: boolean;
  isPreferencesOpen: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: Pick<CookieConsentPreferences, "analytics" | "advertising">) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};
const CookieConsentContext = createContext<ConsentContextValue | null>(null);
const newPreferences = (analytics: boolean, advertising: boolean): CookieConsentPreferences => ({ version: COOKIE_CONSENT_VERSION, necessary: true, analytics, advertising, updatedAt: new Date().toISOString() });

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(null);
  const [ready, setReady] = useState(false);
  const [isPreferencesOpen, setPreferencesOpen] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { setPreferences(readCookieConsent()); setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  const persist = useCallback((next: CookieConsentPreferences) => { setPreferences(next); saveCookieConsent(next); updateGoogleConsent(next); if (!next.analytics) removeKnownGoogleAnalyticsCookies(); window.dispatchEvent(new CustomEvent("kivai:cookie-consent-updated", { detail: next })); }, []);
  const acceptAll = useCallback(() => persist(newPreferences(true, true)), [persist]);
  const rejectOptional = useCallback(() => persist(newPreferences(false, false)), [persist]);
  const savePreferences = useCallback((next: Pick<CookieConsentPreferences, "analytics" | "advertising">) => persist(newPreferences(next.analytics, next.advertising)), [persist]);
  const value = useMemo(() => ({ preferences, hasDecision: preferences !== null, isPreferencesOpen, acceptAll, rejectOptional, savePreferences, openPreferences: () => setPreferencesOpen(true), closePreferences: () => setPreferencesOpen(false) }), [acceptAll, isPreferencesOpen, preferences, rejectOptional, savePreferences]);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return <CookieConsentContext.Provider value={value}>{children}{ready && <><CookieConsentBanner /><CookiePreferencesDialog />{preferences?.analytics && gaId && <GoogleAnalytics gaId={gaId} />}{preferences?.advertising && adsenseClient && <Script id="google-adsense" strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} crossOrigin="anonymous" />}</>}</CookieConsentContext.Provider>;
}

export function useCookieConsent() { const context = useContext(CookieConsentContext); if (!context) throw new Error("useCookieConsent must be used within CookieConsentProvider"); return context; }
