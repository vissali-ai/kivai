"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookmarkPlus, X } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
import { getToolBySlug } from "@/lib/tools";
import { recordSuccessfulToolUse } from "@/lib/pwa/install-eligibility";

const NEXT_INVITATION_KEY = "kivai_post_result_welcome_next_at";
const DAY = 24 * 60 * 60 * 1000;

function postpone(days: number) {
  try { window.localStorage.setItem(NEXT_INVITATION_KEY, String(Date.now() + days * DAY)); } catch { /* Storage may be unavailable. */ }
}

// Display only after a real completed-result card exists. Never interrupt processing or downloads.
export function PostResultWelcome() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const slug = /^\/ferramentas\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1] ?? "";
  const tool = getToolBySlug(slug);

  useEffect(() => {
    if (tool?.available) recordSuccessfulToolUse(slug);
  }, [slug, tool]);

  useEffect(() => {
    if (!tool || getStoredSession()?.access_token) return;
    try {
      const nextAt = Number(window.localStorage.getItem(NEXT_INVITATION_KEY) || "0");
      if (Date.now() < nextAt) return;
    } catch { /* Show normally when storage is unavailable. */ }
    postpone(7);
    setVisible(true);
  }, [tool]);

  if (!visible || !tool) return null;

  return (
    <aside aria-label="Conheça sua conta Kivai" className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.035] p-3 sm:p-4">
      <div className="flex items-start gap-2.5">
        <BookmarkPlus className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Resultado pronto! Que tal guardar suas ferramentas?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
            Crie sua conta gratuita, escolha seus interesses e encontre {tool.name} e outras ferramentas no seu painel.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href={`/conta/cadastro?next=${encodeURIComponent(pathname)}`} className="inline-flex min-h-9 items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">Criar conta grátis</Link>
            <Link href={`/conta/login?next=${encodeURIComponent(pathname)}`} className="inline-flex min-h-9 items-center rounded-md border border-primary/25 px-3 py-2 text-xs font-medium hover:bg-primary/10">Já tenho conta</Link>
          </div>
        </div>
        <button type="button" onClick={() => { postpone(30); setVisible(false); }} aria-label="Dispensar convite" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"><X className="size-4" aria-hidden="true" /></button>
      </div>
    </aside>
  );
}
