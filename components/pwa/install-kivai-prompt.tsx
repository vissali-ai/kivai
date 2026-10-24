"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { deferInstallOffer, isEligibleForInstallOffer } from "@/lib/pwa/install-eligibility";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function alreadyInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallKivaiPrompt() {
  const pathname = usePathname();
  const deferred = useRef<InstallEvent | null>(null);
  const [available, setAvailable] = useState(false);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hostname === "trafego.kivai.com.br") return;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as InstallEvent;
      setAvailable(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setAvailable(false);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const appleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIos(appleMobile);
    const privateArea = pathname.startsWith("/admin") || pathname === "/login";
    setVisible(!privateArea && window.location.hostname !== "trafego.kivai.com.br" &&
      !alreadyInstalled() && isEligibleForInstallOffer(Date.now(), pathname) && (Boolean(deferred.current) || appleMobile));
  }, [pathname, available]);

  async function install() {
    if (!deferred.current || busy) return;
    setBusy(true);
    try {
      const event = deferred.current;
      await event.prompt();
      const choice = await event.userChoice;
      deferred.current = null;
      setAvailable(false);
      if (choice.outcome === "accepted") setVisible(false);
      else { deferInstallOffer(30); setVisible(false); }
    } catch {
      setInstructions(true);
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <aside aria-label="Instalar Kivai" className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 z-40 w-[min(21rem,calc(100vw-1.5rem))] rounded-xl border border-primary/25 bg-card/95 p-3 shadow-xl shadow-black/30 backdrop-blur-lg sm:bottom-5 sm:left-5">
      <div className="flex items-start gap-2.5">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Tenha o Kivai na tela inicial</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Acesse suas ferramentas em um toque, sem procurar o site novamente.</p>
        </div>
        <button type="button" aria-label="Dispensar convite para instalar" className="rounded-md p-1 text-muted-foreground hover:bg-muted/70 hover:text-foreground" onClick={() => { deferInstallOffer(); setVisible(false); }}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {ios && instructions ? (
        <p className="mt-3 rounded-md border border-border bg-background/60 p-2.5 text-xs leading-5 text-foreground">
          No iPhone ou iPad, abra o menu <Share2 className="inline size-3.5 align-[-2px]" aria-hidden="true" /> Compartilhar no navegador e selecione <strong>Adicionar à Tela de Início</strong>. Confirme a instalação.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 pl-6">
        {deferred.current ? (
          <button type="button" disabled={busy} onClick={() => void install()} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Download className="size-3.5" aria-hidden="true" /> {busy ? "Abrindo..." : "Instalar Kivai"}
          </button>
        ) : ios ? (
          <button type="button" onClick={() => setInstructions((current) => !current)} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
            <Share2 className="size-3.5" aria-hidden="true" /> {instructions ? "Ocultar instruções" : "Como instalar"}
          </button>
        ) : null}
        <button type="button" className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => { deferInstallOffer(30); setVisible(false); }}>Agora não</button>
      </div>
    </aside>
  );
}
