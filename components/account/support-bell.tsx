"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, MessageSquare, Megaphone, RefreshCw } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";

type SupportNotice = {
  id: string; ticket_id: string; kind: string; title: string;
  read_at: string | null; created_at: string;
};
type Announcement = {
  id: string; title: string; body: string; link_url: string | null;
  read: boolean; created_at: string;
};

export function SupportBell() {
  const [support, setSupport] = useState<SupportNotice[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [busySupport, setBusySupport] = useState(false);
  const [busyAnnouncement, setBusyAnnouncement] = useState("");
  const [errors, setErrors] = useState({ support: "", announcements: "" });
  const box = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const token = getStoredSession()?.access_token;
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [supportResult, announcementResult] = await Promise.allSettled([
      fetch("/api/account/support/notifications", { headers, cache: "no-store" }),
      fetch("/api/account/announcements", { headers, cache: "no-store" }),
    ]);
    if (supportResult.status === "fulfilled" && supportResult.value.ok) {
      try {
        const data = await supportResult.value.json() as { notifications: SupportNotice[] };
        setSupport(Array.isArray(data.notifications) ? data.notifications : []);
        setErrors((current) => ({ ...current, support: "" }));
      } catch {
        setErrors((current) => ({ ...current, support: "Não foi possível consultar os atendimentos." }));
      }
    } else {
      setErrors((current) => ({ ...current, support: "Não foi possível consultar os atendimentos." }));
    }
    if (announcementResult.status === "fulfilled" && announcementResult.value.ok) {
      try {
        const data = await announcementResult.value.json() as { notices: Announcement[] };
        setAnnouncements(Array.isArray(data.notices) ? data.notices : []);
        setErrors((current) => ({ ...current, announcements: "" }));
      } catch {
        setErrors((current) => ({ ...current, announcements: "Não foi possível consultar os avisos." }));
      }
    } else {
      setErrors((current) => ({ ...current, announcements: "Não foi possível consultar os avisos." }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    const update = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function markSupport(ids: string[], all = false) {
    const token = getStoredSession()?.access_token;
    if (!token || busySupport) return;
    setBusySupport(true);
    try {
      const response = await fetch("/api/account/support/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(all ? { all: true } : { ids }),
      });
      if (!response.ok) throw new Error("Não foi possível marcar os atendimentos como lidos.");
      setSupport((current) => current.map((notice) =>
        all || ids.includes(notice.id)
          ? { ...notice, read_at: notice.read_at || new Date().toISOString() }
          : notice
      ));
      setErrors((current) => ({ ...current, support: "" }));
    } catch {
      setErrors((current) => ({ ...current, support: "Não foi possível marcar os atendimentos como lidos." }));
    } finally {
      setBusySupport(false);
    }
  }

  async function markAnnouncement(id: string) {
    const token = getStoredSession()?.access_token;
    if (!token || busyAnnouncement) return;
    setBusyAnnouncement(id);
    try {
      const response = await fetch("/api/account/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
        keepalive: true,
      });
      if (!response.ok) throw new Error("Não foi possível marcar o aviso como lido.");
      setAnnouncements((current) => current.map((notice) =>
        notice.id === id ? { ...notice, read: true } : notice
      ));
      setErrors((current) => ({ ...current, announcements: "" }));
    } catch {
      setErrors((current) => ({ ...current, announcements: "Não foi possível marcar o aviso como lido." }));
    } finally {
      setBusyAnnouncement("");
    }
  }

  const supportUnread = support.filter((notice) => !notice.read_at).length;
  const announcementUnread = announcements.filter((notice) => !notice.read).length;
  const unread = supportUnread + announcementUnread;
  return <div ref={box} className="relative">
    <button
      type="button"
      onClick={() => { setOpen((value) => !value); void refresh(); }}
      aria-label={`Notificações: ${unread} não lidas`}
      aria-expanded={open}
      title="Notificações"
      className="relative inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Bell className="size-5" />
      {unread > 0 ? <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}
    </button>
    {open ? <section role="region" aria-label="Notificações" className="fixed inset-x-4 top-20 z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[min(360px,calc(100vw-2rem))]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold">Notificações {unread > 0 ? `(${unread})` : ""}</p>
        <button type="button" onClick={() => void refresh()} aria-label="Atualizar notificações" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><RefreshCw className="size-4" /></button>
      </div>
      <div className="space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold"><Megaphone className="size-4 text-primary" /> Central de avisos {announcementUnread ? `(${announcementUnread})` : ""}</p>
          </div>
          {errors.announcements ? <p role="alert" className="mb-2 text-xs text-destructive">{errors.announcements}</p> : null}
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {announcements.length ? announcements.map((notice) => <article key={notice.id} className={`rounded-lg border border-border p-3 text-sm ${notice.read ? "" : "bg-primary/10"}`}>
              <p className="font-medium">{notice.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{notice.body}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {notice.link_url ? <Link href={notice.link_url} onClick={() => { setOpen(false); if (!notice.read) void markAnnouncement(notice.id); }} className="text-xs font-medium text-primary hover:underline">Saiba mais</Link> : <span />}
                {!notice.read ? <button type="button" disabled={Boolean(busyAnnouncement)} onClick={() => void markAnnouncement(notice.id)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"><Check className="size-3" /> Marcar como lido</button> : <span className="text-xs text-muted-foreground">Lido</span>}
              </div>
            </article>) : <p className="px-2 py-3 text-xs text-muted-foreground">Nenhum aviso disponível.</p>}
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="size-4 text-primary" /> Atendimento {supportUnread ? `(${supportUnread})` : ""}</p>
            {supportUnread ? <button type="button" disabled={busySupport} onClick={() => void markSupport([], true)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"><Check className="size-3" /> Marcar lidas</button> : null}
          </div>
          {errors.support ? <p role="alert" className="mb-2 text-xs text-destructive">{errors.support}</p> : null}
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {support.length ? support.slice(0, 15).map((notice) => <Link key={notice.id} href={`/conta/atendimento?ticket=${encodeURIComponent(notice.ticket_id)}`} onClick={() => { setOpen(false); if (!notice.read_at) void markSupport([notice.id]); }} className={`block rounded-lg border border-transparent p-3 text-sm hover:border-border hover:bg-muted/60 ${notice.read_at ? "" : "bg-primary/10"}`}>
              <span className="flex items-center gap-2"><MessageSquare className="size-4 shrink-0 text-primary" /><span className="font-medium">{notice.title}</span>{!notice.read_at ? <span className="ml-auto size-2 shrink-0 rounded-full bg-red-600" /> : null}</span>
              <span className="ml-6 mt-1 block text-xs text-muted-foreground">{new Date(notice.created_at).toLocaleString("pt-BR")}</span>
            </Link>) : <p className="px-2 py-3 text-xs text-muted-foreground">Nenhuma notificação de atendimento.</p>}
          </div>
          <Link href="/conta/atendimento" onClick={() => setOpen(false)} className="mt-2 block border-t border-border pt-3 text-center text-sm font-medium text-primary hover:underline">Abrir Central de Atendimento</Link>
        </div>
      </div>
    </section> : null}
  </div>;
}
