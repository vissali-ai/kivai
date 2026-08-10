"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getToolBySlug, toolCategories } from "@/lib/tools";

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
  const slug = pathname.split("/").filter(Boolean)[1] ?? "";
  const tool = getToolBySlug(slug);
  const category = toolCategories.find((item) => item.slug === tool?.category);

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

  const categoryName = category?.slug === "pdf" ? "PDF" : category?.name;

  return (
    <div
      ref={rootRef}
      className={tool && category ? "tool-route-shell relative" : undefined}
    >
      {tool && category && (
        <nav
          aria-label="Navegação estrutural da ferramenta"
          className="tool-route-breadcrumb absolute inset-x-0 top-24 z-20 mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto whitespace-nowrap px-4 text-sm text-muted-foreground sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            className="shrink-0 transition-colors hover:text-foreground"
          >
            Início
          </Link>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          <Link
            href={category.href}
            className="shrink-0 transition-colors hover:text-foreground"
          >
            {categoryName}
          </Link>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          <span aria-current="page" className="truncate text-foreground">
            {tool.name}
          </span>
        </nav>
      )}
      {children}
    </div>
  );
}
