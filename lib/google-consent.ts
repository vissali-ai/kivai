import type { CookieConsentPreferences } from "@/types/cookie-consent";

type ConsentValue = "granted" | "denied";
type Gtag = (...args: unknown[]) => void;

declare global { interface Window { dataLayer?: unknown[]; gtag?: Gtag; } }

export function updateGoogleConsent(preferences: Pick<CookieConsentPreferences, "analytics" | "advertising">) {
  window.dataLayer ??= [];
  window.gtag ??= function gtag(...args: unknown[]) { window.dataLayer?.push(args); };
  const analytics: ConsentValue = preferences.analytics ? "granted" : "denied";
  const advertising: ConsentValue = preferences.advertising ? "granted" : "denied";
  window.gtag("consent", "update", { analytics_storage: analytics, ad_storage: advertising, ad_user_data: advertising, ad_personalization: advertising });
}

export function removeKnownGoogleAnalyticsCookies() {
  // JavaScript cannot remove HttpOnly or third-party cookies. Only known first-party GA cookie names are targeted.
  const names = document.cookie.split(";").map((item) => item.trim().split("=")[0]).filter((name) => /^(?:_ga(?:_|$)|_gid$|_gat)/.test(name));
  const domains = [location.hostname, `.${location.hostname}`];
  for (const name of names) for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`;
}
