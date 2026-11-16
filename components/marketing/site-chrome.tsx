"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};
const isStreamingHost = () => typeof window !== "undefined" && window.location.hostname.toLowerCase() === "streaming.kivai.com.br";

export function SiteChrome({ children, mainHeader, musicHeader, mainFooter }: {
  children: ReactNode;
  mainHeader: ReactNode;
  musicHeader: ReactNode;
  mainFooter: ReactNode;
}) {
  const streaming = useSyncExternalStore(subscribe, isStreamingHost, () => false);
  return <>
    {streaming ? musicHeader : mainHeader}
    {children}
    {!streaming ? mainFooter : null}
  </>;
}