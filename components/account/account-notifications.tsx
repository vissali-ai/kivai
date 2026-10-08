"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
import type { UserAnnouncement } from "@/lib/account/announcements";

export function AccountNotifications() {
  const [items, setItems] = useState<UserAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const token = getStoredSession()?.access_token;
    if (!token) { setLoading(false); return; }
    try {
      const response = await fetch("/api/account/announcements", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Não foi possível carregar os avisos.");
      const data = await response.json() as { notices: UserAnnouncement[] };
      setItems(data.notices); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao carregar avisos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const unread = items.filter((item) => !item.read).length;

  async function markRead(id: string) {
    if (busy) return;
    const token = getStoredSession()?.access_token;
    if (!token) return;
    setBusy(id);
    try {
      const response = await fetch("/api/account/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Não foi possível marcar como lido.");
      setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao marcar aviso."); }
    finally { setBusy(""); }
  }

  return <section className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6" aria-labelledby="notices-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="notices-title" className="flex items-center gap-2 text-xl font-semibold">
          <Bell className="size-5 text-primary" /> Central de avisos
          {unread ? <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground" aria-label={`${unread} avisos não lidos`}>{unread}</span> : null}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Novidades, dicas e mensagens importantes da sua conta.</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => void refresh()} aria-label="Atualizar avisos" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-foreground"><RefreshCw className="size-4" /></button>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary">{open ? "Ocultar avisos" : `Ver avisos${unread ? ` (${unread})` : ""}`}</button>
      </div>
    </div>
    {error ? <p role="alert" className="mt-3 text-sm text-red-400">{error}</p> : null}
    {loading ? <p className="mt-3 text-sm text-muted-foreground">Carregando avisos...</p> : null}
    {open && !loading ? <div className="mt-4 space-y-3">
      {!items.length ? <p className="text-sm text-muted-foreground">Nenhum aviso disponível no momento.</p> : null}
      {items.map((notice) => <article key={notice.id} className={`rounded-xl border p-4 ${notice.read ? "border-white/10" : "border-primary/35 bg-primary/[0.04]"}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold">{notice.title}</h3>
          {!notice.read ? <button type="button" disabled={busy === notice.id} onClick={() => void markRead(notice.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"><Check className="size-3.5" /> Marcar como lido</button> : <span className="text-xs text-muted-foreground">Lido</span>}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{notice.body}</p>
        {notice.link_url ? <Link href={notice.link_url} onClick={() => { if (!notice.read) void markRead(notice.id); }} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Saiba mais →</Link> : null}
      </article>)}
    </div> : null}
  </section>;
}
