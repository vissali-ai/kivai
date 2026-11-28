"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";

const streamingBodyFont = Inter({ subsets: ["latin"], variable: "--font-streaming-body", display: "swap" });
const streamingHeadingFont = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-streaming-heading", display: "swap" });


export function SiteChrome({ children, mainHeader, musicHeader, mainFooter }: {
  children: ReactNode;
  mainHeader: ReactNode;
  musicHeader: ReactNode;
  mainFooter: ReactNode;
}) {
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const active = window.location.hostname.toLowerCase() === "streaming.kivai.com.br";
    setStreaming(active);
    document.documentElement.classList.toggle("kivai-streaming-host", active);
    document.body.classList.toggle("kivai-streaming-host", active);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", active ? "#6B0F8C" : "#6C2BD9");
    return () => {
      document.documentElement.classList.remove("kivai-streaming-host");
      document.body.classList.remove("kivai-streaming-host");
    };
  }, []);
  return (
    <div className={`${streaming ? "kivai-streaming-theme min-h-screen" : "contents"} ${streaming ? `${streamingBodyFont.variable} ${streamingHeadingFont.variable}` : ""}`}>
      {streaming ? musicHeader : mainHeader}
      {children}
      {!streaming ? mainFooter : null}
    </div>
  );
}
