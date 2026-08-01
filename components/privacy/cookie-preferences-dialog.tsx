"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/privacy/cookie-consent-provider";

export function CookiePreferencesDialog() {
  const { isPreferencesOpen, preferences } = useCookieConsent();
  return isPreferencesOpen ? <CookiePreferencesDialogContent key={preferences?.updatedAt ?? "new"} analytics={preferences?.analytics ?? false} advertising={preferences?.advertising ?? false} /> : null;
}

function CookiePreferencesDialogContent({ analytics: initialAnalytics, advertising: initialAdvertising }: { analytics: boolean; advertising: boolean }) {
  const { closePreferences, acceptAll, rejectOptional, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [advertising, setAdvertising] = useState(initialAdvertising);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") { closePreferences(); return; }
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));
    const first = focusable[0], last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const save = () => { savePreferences({ analytics, advertising }); closePreferences(); };
  const accept = () => { acceptAll(); closePreferences(); };
  const reject = () => { rejectOptional(); closePreferences(); };
  return <div className="fixed inset-0 z-[110] flex items-end bg-black/60 p-3 sm:items-center sm:justify-center" role="presentation"><section onKeyDown={trapFocus} role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title" aria-describedby="cookie-dialog-description" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="cookie-dialog-title" className="text-xl font-semibold">Preferências de cookies</h2><p id="cookie-dialog-description" className="mt-2 text-sm leading-6 text-muted-foreground">Escolha quais categorias opcionais podem ser utilizadas. Cookies necessários permanecem ativos.</p></div><button ref={closeRef} type="button" onClick={closePreferences} aria-label="Fechar preferências de cookies" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button></div><div className="mt-6 divide-y divide-border border-y border-border"><Preference title="Cookies necessários" description="Essenciais para segurança, navegação e funcionamento do site." checked disabled onChange={() => undefined} /><Preference title="Cookies de análise" description="Ajudam a entender como os visitantes utilizam o Kivai por meio de dados estatísticos." checked={analytics} onChange={setAnalytics} /><Preference title="Cookies de publicidade" description="Permitem medir campanhas, exibir anúncios e, quando autorizado, personalizar publicidade." checked={advertising} onChange={setAdvertising} /></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={save}>Salvar preferências</Button><Button variant="outline" onClick={accept}>Aceitar todos</Button><Button variant="outline" onClick={reject}>Recusar opcionais</Button></div></section></div>;
}
function Preference({ title, description, checked, disabled = false, onChange }: { title: string; description: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) { const id = title.toLowerCase().replace(/\s+/g, "-"); return <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-5 py-4"><span><span className="block text-sm font-medium">{title}{disabled && <span className="ml-2 text-xs font-normal text-muted-foreground">Sempre ativos</span>}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span></span><input id={id} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-primary" /></label>; }
