"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const DOWNLOAD_LABEL = /\b(baixar|download|exportar)\b/i;
const ACTION_SELECTOR = 'a[download], button, [role="button"]';

function isAvailableDownloadAction(element: HTMLElement) {
  const label = [
    element.textContent,
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
  ]
    .filter(Boolean)
    .join(" ");

  const isDownload =
    element.matches("a[download]") || DOWNLOAD_LABEL.test(label);
  const isDisabled =
    (element instanceof HTMLButtonElement && element.disabled) ||
    element.getAttribute("aria-disabled") === "true";
  const style = window.getComputedStyle(element);

  return (
    isDownload &&
    !isDisabled &&
    !element.hidden &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    element.getClientRects().length > 0
  );
}

export function ToolDownloadNavigator({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const seen = new WeakSet<HTMLElement>();
    let resultIsVisible = false;
    let firstFrame = 0;
    let secondFrame = 0;

    const findActions = () =>
      Array.from(root.querySelectorAll<HTMLElement>(ACTION_SELECTOR)).filter(
        isAvailableDownloadAction,
      );

    const initialActions = findActions();
    initialActions.forEach((action) => seen.add(action));
    resultIsVisible = initialActions.length > 0;

    const inspect = () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);

      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (window.location.pathname !== pathname) return;

          const actions = findActions();
          const firstNewAction = actions.find((action) => !seen.has(action));
          actions.forEach((action) => seen.add(action));

          if (actions.length === 0) {
            resultIsVisible = false;
            return;
          }

          if (!resultIsVisible && firstNewAction) {
            const reduceMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;

            firstNewAction.scrollIntoView({
              behavior: reduceMotion ? "auto" : "smooth",
              block: "center",
              inline: "nearest",
            });
          }

          resultIsVisible = true;
        });
      });
    };

    const observer = new MutationObserver(inspect);
    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        "aria-disabled",
        "aria-label",
        "class",
        "disabled",
        "download",
        "hidden",
        "href",
        "style",
        "title",
      ],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  return <div ref={rootRef}>{children}</div>;
}
