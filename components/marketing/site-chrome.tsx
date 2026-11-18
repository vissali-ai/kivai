"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";

const streamingBodyFont = Inter({ subsets: ["latin"], variable: "--font-streaming-body", display: "swap" });
const streamingHeadingFont = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-streaming-heading", display: "swap" });

const subscribe = () => () => {};
const isStreamingHost = () => typeof window !== "undefined" && window.location.hostname.toLowerCase() === "streaming.kivai.com.br";

export function SiteChrome({ children, mainHeader, musicHeader, mainFooter }: {
  children: ReactNode;
  mainHeader: ReactNode;
  musicHeader: ReactNode;
  mainFooter: ReactNode;
}) {
  const streaming = useSyncExternalStore(subscribe, isStreamingHost, () => false);
  return (
    <div className={`${streaming ? "kivai-streaming-theme min-h-screen" : "contents"} ${streaming ? `${streamingBodyFont.variable} ${streamingHeadingFont.variable}` : ""}`}>
      {streaming ? musicHeader : mainHeader}
      {children}
      {!streaming ? mainFooter : null}
    </div>
  );
}
