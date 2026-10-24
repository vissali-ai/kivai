"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function HorizontalToolCarousel({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      setCanGoBack(track.scrollLeft > 2);
      setCanGoForward(maxScroll > 2 && track.scrollLeft < maxScroll - 2);
    };

    updateButtons();
    track.addEventListener("scroll", updateButtons, { passive: true });
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateButtons) : null;
    resizeObserver?.observe(track);

    return () => {
      track.removeEventListener("scroll", updateButtons);
      resizeObserver?.disconnect();
    };
  }, []);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * Math.max(260, track.clientWidth * 0.8),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#202938]">Mais usadas</h2>
        <div className="flex items-center gap-2" aria-label="Navegação das ferramentas mais usadas">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canGoBack}
            aria-label="Voltar nas ferramentas mais usadas"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[#D3DAE4] bg-[#F9FAFB] text-[#3F4A5A] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5847AD]"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canGoForward}
            aria-label="Avançar nas ferramentas mais usadas"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[#D3DAE4] bg-[#F9FAFB] text-[#3F4A5A] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5847AD]"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        role="region"
        aria-label="Ferramentas mais usadas, lista com rolagem horizontal"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-color:#B9C1CE_transparent] [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5847AD]"
      >
        {children}
      </div>
    </>
  );
}
