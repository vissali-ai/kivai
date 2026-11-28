import type { ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";

const streamingBodyFont = Inter({ subsets: ["latin"], variable: "--font-streaming-body", display: "swap" });
const streamingHeadingFont = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-streaming-heading", display: "swap" });


export function SiteChrome({ children, mainHeader, musicHeader, mainFooter, isStreamingHost }: {
  children: ReactNode;
  mainHeader: ReactNode;
  musicHeader: ReactNode;
  mainFooter: ReactNode;
  isStreamingHost: boolean;
}) {
  return (
    <div className={`${isStreamingHost ? "kivai-streaming-theme min-h-screen" : "contents"} ${isStreamingHost ? `${streamingBodyFont.variable} ${streamingHeadingFont.variable}` : ""}`}>
      {isStreamingHost ? musicHeader : mainHeader}
      {children}
      {!isStreamingHost ? mainFooter : null}
    </div>
  );
}
