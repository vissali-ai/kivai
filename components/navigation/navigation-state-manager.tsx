"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SCROLL_PREFIX = "kivai:scroll:";
const DEPTH_KEY = "kivai:navigation-depth";
const HISTORY_DEPTH_KEY = "__kivaiNavigationDepth";

function getRouteKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function readDepth() {
  const stateDepth = window.history.state?.[HISTORY_DEPTH_KEY];
  if (typeof stateDepth === "number") return stateDepth;

  const storedDepth = Number(window.sessionStorage.getItem(DEPTH_KEY) ?? "0");
  return Number.isFinite(storedDepth) && storedDepth >= 0 ? storedDepth : 0;
}

function writeDepth(depth: number) {
  const safeDepth = Math.max(0, depth);
  window.sessionStorage.setItem(DEPTH_KEY, String(safeDepth));
  window.history.replaceState(
    { ...window.history.state, [HISTORY_DEPTH_KEY]: safeDepth },
    ""
  );
}

function saveScrollPosition() {
  const key = getRouteKey();
  window.sessionStorage.setItem(
    `${SCROLL_PREFIX}${key}`,
    JSON.stringify({ x: window.scrollX, y: window.scrollY })
  );
}

function restoreScrollPosition(key: string) {
  const raw = window.sessionStorage.getItem(`${SCROLL_PREFIX}${key}`);
  if (!raw) return;

  let position: { x?: number; y?: number } | null = null;

  try {
    position = JSON.parse(raw) as { x?: number; y?: number };
  } catch {
    return;
  }

  const x = typeof position.x === "number" ? position.x : 0;
  const y = typeof position.y === "number" ? position.y : 0;
  let attempts = 0;

  const tryRestore = () => {
    attempts += 1;

    const pageCanReachTarget =
      y === 0 || document.documentElement.scrollHeight >= y + window.innerHeight;

    if (pageCanReachTarget) {
      window.scrollTo({ left: x, top: y, behavior: "instant" });

      if (Math.abs(window.scrollY - y) <= 2) return;
    }

    if (attempts < 30) window.requestAnimationFrame(tryRestore);
  };

  window.requestAnimationFrame(tryRestore);
}

function isPlainInternalNavigation(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin;
}

export function NavigationStateManager() {
  const pathname = usePathname();
  const previousRouteRef = useRef<string | null>(null);
  const pendingForwardNavigationRef = useRef(false);
  const restoringFromHistoryRef = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    writeDepth(readDepth());
    previousRouteRef.current = getRouteKey();

    let scrollFrame: number | null = null;

    const handleScroll = () => {
      if (scrollFrame !== null) return;

      scrollFrame = window.requestAnimationFrame(() => {
        saveScrollPosition();
        scrollFrame = null;
      });
    };

    const handlePopState = (event: PopStateEvent) => {
      restoringFromHistoryRef.current = true;
      pendingForwardNavigationRef.current = false;

      const stateDepth = event.state?.[HISTORY_DEPTH_KEY];
      if (typeof stateDepth === "number") {
        window.sessionStorage.setItem(DEPTH_KEY, String(Math.max(0, stateDepth)));
      }

      const destinationKey = getRouteKey();
      restoreScrollPosition(destinationKey);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isPlainInternalNavigation(event, anchor)) return;

      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(anchor.href, window.location.href);
      const isSameDocument =
        currentUrl.pathname === targetUrl.pathname &&
        currentUrl.search === targetUrl.search;

      if (isSameDocument && targetUrl.hash) return;

      const label = (anchor.textContent ?? "").trim();
      const isBackLink = /^voltar\b/i.test(label);
      const currentDepth = readDepth();

      saveScrollPosition();

      if (isBackLink && currentDepth > 0) {
        event.preventDefault();
        restoringFromHistoryRef.current = true;
        pendingForwardNavigationRef.current = false;
        window.history.back();
        return;
      }

      if (!isSameDocument) {
        pendingForwardNavigationRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  useEffect(() => {
    const currentRoute = getRouteKey();

    if (previousRouteRef.current === null) {
      previousRouteRef.current = currentRoute;
      return;
    }

    if (previousRouteRef.current === currentRoute) return;

    if (restoringFromHistoryRef.current) {
      const historyDepth = window.history.state?.[HISTORY_DEPTH_KEY];
      if (typeof historyDepth === "number") {
        window.sessionStorage.setItem(DEPTH_KEY, String(Math.max(0, historyDepth)));
      }
      restoreScrollPosition(currentRoute);
      restoringFromHistoryRef.current = false;
    } else if (pendingForwardNavigationRef.current) {
      const nextDepth = readDepth() + 1;
      writeDepth(nextDepth);
      pendingForwardNavigationRef.current = false;
    } else {
      writeDepth(readDepth());
    }

    previousRouteRef.current = currentRoute;
  }, [pathname]);

  return null;
}
