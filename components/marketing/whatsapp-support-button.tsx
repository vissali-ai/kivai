"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

type PublicConfig = {
  enabled: boolean;
  phone: string;
  message: string;
};

export function WhatsappSupportButton() {
  const pathname = usePathname();
  const isPrivatePage = pathname.startsWith("/admin")
    || pathname === "/login"
    || pathname.startsWith("/conta");
  const [config, setConfig] = useState<PublicConfig | null>(null);

  useEffect(() => {
    if (isPrivatePage) return;

    const controller = new AbortController();
    fetch("/api/public/whatsapp-widget", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? await response.json() as PublicConfig : null)
      .then((data) => {
        if (!controller.signal.aborted) setConfig(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfig(null);
      });

    return () => controller.abort();
  }, [isPrivatePage]);

  if (isPrivatePage || !config?.enabled || !/^55\d{10,11}$/.test(config.phone)) return null;

  const href = `https://wa.me/${config.phone}?text=${encodeURIComponent(config.message)}`;

  function trackClick() {
    const analytics = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    analytics?.("event", "whatsapp_support_click", {
      page_path: window.location.pathname,
      element: "floating_whatsapp_support",
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      title="Fale com o Kivai pelo WhatsApp"
      aria-label="Fale com o Kivai pelo WhatsApp"
      className="fixed right-4 z-40 inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-[#25D366] px-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:right-6 sm:px-4"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <MessageCircle aria-hidden="true" className="size-6 shrink-0" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
