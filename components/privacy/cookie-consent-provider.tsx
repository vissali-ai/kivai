"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ConsentedGoogleServices } from "@/components/privacy/consented-google-services";
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner";
import { CookiePreferencesDialog } from "@/components/privacy/cookie-preferences-dialog";
import {
  COOKIE_CONSENT_VERSION,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";
import {
  removeKnownGoogleAnalyticsCookies,
  updateGoogleConsent,
} from "@/lib/google-consent";
import type { CookieConsentPreferences } from "@/types/cookie-consent";

type ConsentContextValue = {
  preferences: CookieConsentPreferences | null;
  hasDecision: boolean;
  isPreferencesOpen: boolean;
  googleCmpManaged: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (
    preferences: Pick<CookieConsentPreferences, "analytics" | "advertising">
  ) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

type TcData = {
  gdprApplies?: boolean;
};

type TcfApi = (
  command: string,
  version: number,
  callback: (tcData: TcData | null, success: boolean) => void
) => void;

type GoogleFcCallback =
  | (() => void)
  | {
      CONSENT_API_READY?: () => void;
    };

type GoogleFc = {
  callbackQueue: GoogleFcCallback[];
  showRevocationMessage?: () => void;
};

type ConsentWindow = Window & {
  __tcfapi?: TcfApi;
  googlefc?: GoogleFc;
};

const CookieConsentContext = createContext<ConsentContextValue | null>(null);

const newPreferences = (
  analytics: boolean,
  advertising: boolean
): CookieConsentPreferences => ({
  version: COOKIE_CONSENT_VERSION,
  necessary: true,
  analytics,
  advertising,
  updatedAt: new Date().toISOString(),
});

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] =
    useState<CookieConsentPreferences | null>(null);
  const [ready, setReady] = useState(false);
  const [googleCmpManaged, setGoogleCmpManaged] = useState(false);
  const [isPreferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let localConsentResolved = false;

    const activateLocalConsent = () => {
      if (cancelled || localConsentResolved) return;

      localConsentResolved = true;
      const storedPreferences = readCookieConsent();

      if (storedPreferences) {
        updateGoogleConsent(storedPreferences);
      }

      setGoogleCmpManaged(false);
      setPreferences(storedPreferences);
      setReady(true);
    };

    const activateGoogleCmp = () => {
      if (cancelled) return;

      localConsentResolved = true;
      setGoogleCmpManaged(true);
      setPreferences(null);
      setPreferencesOpen(false);
      setReady(true);
    };

    const consentWindow = window as ConsentWindow;
    const googlefc = consentWindow.googlefc ?? { callbackQueue: [] };

    googlefc.callbackQueue = googlefc.callbackQueue ?? [];
    consentWindow.googlefc = googlefc;

    googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        const tcfApi = consentWindow.__tcfapi;

        if (typeof tcfApi !== "function") return;

        tcfApi("addEventListener", 2, (tcData, success) => {
          if (!success || !tcData || typeof tcData.gdprApplies !== "boolean") {
            return;
          }

          if (tcData.gdprApplies) {
            activateGoogleCmp();
            return;
          }

          activateLocalConsent();
        });
      },
    });

    // Fora das regiões gerenciadas pela CMP do Google, o Kivai continua
    // responsável pelo próprio banner. O atraso dá tempo para a API regional
    // do Google indicar se o GDPR se aplica antes de ativar o fluxo local.
    const fallbackTimer = window.setTimeout(activateLocalConsent, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const persist = useCallback((next: CookieConsentPreferences) => {
    updateGoogleConsent(next);
    saveCookieConsent(next);
    setPreferences(next);

    if (!next.analytics) {
      removeKnownGoogleAnalyticsCookies();
    }

    window.dispatchEvent(
      new CustomEvent("kivai:cookie-consent-updated", { detail: next })
    );
  }, []);

  const acceptAll = useCallback(
    () => persist(newPreferences(true, true)),
    [persist]
  );

  const rejectOptional = useCallback(
    () => persist(newPreferences(false, false)),
    [persist]
  );

  const savePreferences = useCallback(
    (next: Pick<CookieConsentPreferences, "analytics" | "advertising">) =>
      persist(newPreferences(next.analytics, next.advertising)),
    [persist]
  );

  const openPreferences = useCallback(() => {
    if (googleCmpManaged) {
      const consentWindow = window as ConsentWindow;
      const googlefc = consentWindow.googlefc;

      if (
        googlefc?.callbackQueue &&
        typeof googlefc.showRevocationMessage === "function"
      ) {
        googlefc.callbackQueue.push(googlefc.showRevocationMessage);
        return;
      }
    }

    setPreferencesOpen(true);
  }, [googleCmpManaged]);

  const value = useMemo(
    () => ({
      preferences,
      hasDecision: googleCmpManaged || preferences !== null,
      isPreferencesOpen,
      googleCmpManaged,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences: () => setPreferencesOpen(false),
    }),
    [
      acceptAll,
      googleCmpManaged,
      isPreferencesOpen,
      openPreferences,
      preferences,
      rejectOptional,
      savePreferences,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}

      {ready ? (
        <>
          {!googleCmpManaged ? (
            <>
              <CookieConsentBanner />
              <CookiePreferencesDialog />
            </>
          ) : null}

          <ConsentedGoogleServices preferences={preferences} />
        </>
      ) : null}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}
