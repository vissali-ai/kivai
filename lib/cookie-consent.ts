import type { CookieConsentPreferences } from "@/types/cookie-consent";

export const COOKIE_CONSENT_KEY = "kivai_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;

export function isCookieConsent(value: unknown): value is CookieConsentPreferences {
  if (!value || typeof value !== "object") return false;
  const consent = value as Record<string, unknown>;
  return consent.version === COOKIE_CONSENT_VERSION && consent.necessary === true && typeof consent.analytics === "boolean" && typeof consent.advertising === "boolean" && typeof consent.updatedAt === "string";
}

export function readCookieConsent(): CookieConsentPreferences | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCookieConsent(parsed) ? parsed : null;
  } catch { return null; }
}

export function saveCookieConsent(preferences: CookieConsentPreferences) {
  try { window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences)); } catch { /* Consent remains active for this visit if storage is unavailable. */ }
}
