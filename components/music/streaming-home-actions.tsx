"use client";

import { useEffect, useRef, useState } from "react";
import { Download, MessageCircle, Share2 } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type WhatsappConfig = {
  enabled: boolean;
  phone: string;
  message: string;
};

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function getInstallInstructions() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "No iPhone ou iPad, toque em Compartilhar no navegador e escolha Adicionar à Tela de Início. Depois, confirme em Adicionar.";
  }
  if (/Android/i.test(ua)) {
    return "Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial.";
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return "No Safari, use Arquivo > Adicionar ao Dock. No Chrome ou Edge, use a opção Instalar Streaming Kivai no menu do navegador.";
  }
  return "No Chrome ou Edge, abra o menu do navegador e escolha Instalar Streaming Kivai. Em outros navegadores, procure Adicionar à tela inicial ou Criar atalho.";
}

export function StreamingHomeActions() {
  const deferredPrompt = useRef<InstallPromptEvent | null>(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [whatsapp, setWhatsapp] = useState<WhatsappConfig | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hostname.toLowerCase() !== "streaming.kivai.com.br") return;

    setInstalled(isInstalled());

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      }).catch(() => undefined);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as InstallPromptEvent;
      setInstallAvailable(true);
    };
    const onInstalled = () => {
      deferredPrompt.current = null;
      setInstallAvailable(false);
      setInstalled(true);
      setInstructions("");
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(isInstalled());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener?.("change", onDisplayModeChange);

    const controller = new AbortController();
    fetch("/api/public/whatsapp-widget", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? await response.json() as WhatsappConfig : null)
      .then((data) => {
        if (!controller.signal.aborted) setWhatsapp(data);
      })
      .catch(() => undefined);

    return () => {
      controller.abort();
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  async function handleInstall() {
    if (installed || busy) return;

    if (deferredPrompt.current) {
      setBusy(true);
      try {
        const prompt = deferredPrompt.current;
        await prompt.prompt();
        const choice = await prompt.userChoice;
        deferredPrompt.current = null;
        setInstallAvailable(false);
        if (choice.outcome === "accepted") {
          setInstalled(true);
          setInstructions("");
        }
      } catch {
        setInstructions(getInstallInstructions());
      } finally {
        setBusy(false);
      }
      return;
    }

    setInstructions(getInstallInstructions());
  }

  if (typeof window !== "undefined" && window.location.hostname.toLowerCase() !== "streaming.kivai.com.br") {
    return null;
  }

  const whatsappHref = whatsapp?.enabled && /^55\d{10,11}$/.test(whatsapp.phone)
    ? `https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.message)}`
    : null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16a34a]"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      ) : null}

      {!installed ? (
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {installAvailable ? <Download className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
          {busy ? "Abrindo..." : "Instalar Streaming"}
        </button>
      ) : null}

      {instructions ? (
        <p role="status" className="basis-full max-w-2xl rounded-lg border border-border bg-card p-3 text-sm leading-6 text-muted-foreground">
          {instructions}
        </p>
      ) : null}
    </div>
  );
}
