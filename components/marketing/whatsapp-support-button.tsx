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
      title="Atendimento pelo WhatsApp"
      aria-label="Fale com o Kivai pelo WhatsApp"
      className="group fixed right-4 z-40 inline-flex size-11 items-center justify-center rounded-full border border-primary/25 bg-card/95 text-[#80c9a1] shadow-md shadow-black/20 backdrop-blur-md transition-colors duration-200 hover:border-primary/60 hover:bg-secondary hover:text-[#a2e8bb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:right-6"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-[22px]"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.472-.148-.67.15-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.15-.174.198-.298.298-.496.099-.198.05-.372-.025-.52-.074-.149-.669-1.612-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01s-.52.074-.793.372c-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.073c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.862 9.862 0 0 1-5.031-1.378l-.361-.214-3.74.981.998-3.646-.235-.374A9.86 9.86 0 0 1 2.17 12.2C2.173 6.784 6.587 2.37 12.006 2.37c2.628 0 5.099 1.025 6.955 2.883a9.798 9.798 0 0 1 2.88 6.96c-.002 5.416-4.416 9.829-9.79 9.829m8.413-18.21A11.814 11.814 0 0 0 12.006.078C5.461.078.128 5.408.126 11.954a11.83 11.83 0 0 0 1.58 5.916L.026 24l6.273-1.646a11.886 11.886 0 0 0 5.701 1.451h.005c6.544 0 11.878-5.332 11.881-11.877A11.79 11.79 0 0 0 20.464 3.576z" />
      </svg>
      <span className="pointer-events-none absolute right-[calc(100%+0.65rem)] hidden whitespace-nowrap rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-md shadow-black/20 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
        Precisa de ajuda?
      </span>
    </a>
  );
}
