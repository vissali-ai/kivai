"use client";

import { ArrowUpRight } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribeToHost = () => () => {};
const isStreamingHostSnapshot = () =>
  typeof window !== "undefined" &&
  window.location.hostname.toLowerCase() === "streaming.kivai.com.br";

export function FooterEcosystemLink() {
  const isStreamingHost = useSyncExternalStore(
    subscribeToHost,
    isStreamingHostSnapshot,
    () => false,
  );

  if (!isStreamingHost) return null;

  return (
    <section className="mt-6 max-w-md rounded-xl border border-border bg-background p-4" aria-label="Ecossistema Kivai">
      <p className="text-sm font-medium text-foreground">
        O Kivai Música faz parte do ecossistema Kivai.
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Conheça também a plataforma oficial do Kivai.
      </p>
      <a
        href="https://www.kivai.com.br"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visitar o site oficial do Kivai, abre em nova aba"
        className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        Visitar o site oficial
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    </section>
  );
}
