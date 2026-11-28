"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import type { CookieConsentPreferences } from "@/types/cookie-consent";

type ConsentedGoogleServicesProps = {
  preferences: CookieConsentPreferences | null;
};

type GoogleAnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

function AnalyticsEventTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/ferramentas/")) return;

    const toolSlug = pathname.split("/")[2] || "unknown";
    const analyticsWindow = window as GoogleAnalyticsWindow;

    analyticsWindow.gtag?.("event", "tool_view", {
      tool_slug: toolSlug,
      page_path: pathname,
    });
  }, [pathname]);

  useEffect(() => {
    const analyticsWindow = window as GoogleAnalyticsWindow;

    const handleToolClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/ferramentas/")) return;

      const toolSlug = currentPath.split("/")[2] || "unknown";
      const downloadLink = target.closest<HTMLAnchorElement>("a[download]");

      if (downloadLink) {
        const filename = downloadLink.getAttribute("download") || "";
        const extension = filename.includes(".")
          ? filename.split(".").pop()?.toLowerCase() || "unknown"
          : "unknown";

        analyticsWindow.gtag?.("event", "tool_download", {
          tool_slug: toolSlug,
          file_extension: extension,
          page_path: currentPath,
        });
        return;
      }

      const control = target.closest("button, [role='button'], input[type='submit']");
      if (!control) return;

      analyticsWindow.gtag?.("event", "tool_interaction", {
        tool_slug: toolSlug,
        control_type: control.tagName.toLowerCase(),
        page_path: currentPath,
      });
    };

    const handleToolSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/ferramentas/")) return;

      analyticsWindow.gtag?.("event", "tool_submit", {
        tool_slug: currentPath.split("/")[2] || "unknown",
        page_path: currentPath,
      });
    };

    document.addEventListener("click", handleToolClick, true);
    document.addEventListener("submit", handleToolSubmit, true);

    return () => {
      document.removeEventListener("click", handleToolClick, true);
      document.removeEventListener("submit", handleToolSubmit, true);
    };
  }, []);

  return null;
}

/**
 * O Google Analytics só é carregado quando a pessoa autoriza cookies
 * analíticos. Os eventos registram uso sem enviar textos digitados,
 * nomes de arquivos ou outros dados fornecidos pelo usuário.
 */
export function ConsentedGoogleServices({ preferences }: ConsentedGoogleServicesProps) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return preferences?.analytics && gaId ? (
    <>
      <GoogleAnalytics gaId={gaId} />
      <AnalyticsEventTracker />
    </>
  ) : null;
}
