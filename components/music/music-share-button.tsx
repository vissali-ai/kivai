"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type Props = {
  title: string;
  text: string;
  url?: string;
  compact?: boolean;
};

export function MusicShareButton({ title, url, compact = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareUrl = new URL(url || window.location.href, window.location.origin).toString();

    if (navigator.share) {
      try {
        // Envie somente a URL. Não inclua título ou texto promocional no compartilhamento.
        await navigator.share({ url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link para compartilhar:", shareUrl);
    }
  }

  return (
    <button type="button" onClick={() => void share()} aria-label={`Compartilhar ${title}`} title={copied ? "Link copiado" : "Compartilhar"} className={compact ? "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" : "inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"}>
      {copied ? <Check className="size-4 text-green-600" /> : <><Share2 className="size-4" />{compact ? null : "Compartilhar"}</>}
    </button>
  );
}
