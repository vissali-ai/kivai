"use client";
import { useCookieConsent } from "@/components/privacy/cookie-consent-provider";
export function CookieSettingsButton() { const { openPreferences } = useCookieConsent(); return <button type="button" onClick={openPreferences} className="text-left text-sm text-muted-foreground transition hover:text-foreground">Preferências de cookies</button>; }
