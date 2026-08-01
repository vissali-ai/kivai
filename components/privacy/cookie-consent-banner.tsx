"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/privacy/cookie-consent-provider";

export function CookieConsentBanner() {
  const { hasDecision, acceptAll, rejectOptional, openPreferences } = useCookieConsent();
  if (hasDecision) return null;
  return <aside aria-labelledby="cookie-banner-title" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-xl border border-border bg-background p-5 shadow-2xl sm:bottom-6 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><h2 id="cookie-banner-title" className="text-lg font-semibold">Sua privacidade é importante</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Utilizamos cookies necessários para o funcionamento do Kivai e, com sua autorização, cookies de análise e publicidade para entender o uso do site, melhorar nossos serviços e exibir anúncios. Você pode aceitar, recusar ou personalizar suas preferências.</p><Link href="/privacidade" className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">Política de Privacidade</Link></div><div className="flex flex-wrap gap-2 sm:justify-end"><Button variant="outline" onClick={rejectOptional}>Recusar opcionais</Button><Button variant="outline" onClick={openPreferences}>Personalizar</Button><Button onClick={acceptAll}>Aceitar todos</Button></div></div></aside>;
}
