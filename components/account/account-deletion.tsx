"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { getStoredSession, clearSession } from "@/lib/user-auth";

export function AccountDeletion() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmation !== "EXCLUIR" || loading) return;
    const token = getStoredSession()?.access_token;
    if (!token) {
      setError("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirmation, feedback: feedback.trim() || null }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível excluir sua conta. Tente novamente.");
      clearSession();
      window.location.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir sua conta. Tente novamente.");
      setLoading(false);
    }
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); setError(""); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10">
      <Trash2 className="size-4" /> Excluir minha conta
    </button>
    {open && typeof document !== "undefined" ? createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !loading) setOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="account-delete-title" className="my-auto w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-destructive/10 p-2 text-destructive"><AlertTriangle className="size-5" /></span>
              <div><h2 id="account-delete-title" className="text-lg font-semibold">Excluir sua conta Kivai</h2><p className="mt-1 text-sm text-muted-foreground">Esta ação é permanente e não poderá ser desfeita.</p></div>
            </div>
            <button type="button" aria-label="Fechar" disabled={loading} onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent"><X className="size-4" /></button>
          </div>
          <div className="mt-5 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6">
            Ao confirmar, seu acesso e cadastro de usuário serão excluídos. Os dados associados à conta serão removidos conforme as regras de integridade do banco. Se houver assinatura ou cobrança recorrente ativa, será necessário solicitar o cancelamento e aguardar a confirmação antes de excluir a conta.
          </div>
          <label htmlFor="account-delete-feedback" className="mt-5 block text-sm font-medium">Gostaria de contar por que está saindo? <span className="font-normal text-muted-foreground">(opcional)</span></label>
          <textarea id="account-delete-feedback" value={feedback} onChange={event => setFeedback(event.target.value.slice(0, 1000))} rows={3} maxLength={1000} placeholder="Seu feedback nos ajuda a melhorar o Kivai." className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <p className="mt-1 text-right text-xs text-muted-foreground">{feedback.length}/1000</p>
          <label htmlFor="account-delete-confirmation" className="mt-4 block text-sm font-medium">Para confirmar, digite EXCLUIR</label>
          <input id="account-delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value.toUpperCase().slice(0, 7))} autoComplete="off" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={loading} onClick={() => setOpen(false)} className="min-h-10 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">Manter minha conta</button>
            <button type="button" disabled={loading || confirmation !== "EXCLUIR"} onClick={handleDelete} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50">
              <Trash2 className="size-4" /> {loading ? "Excluindo..." : "Excluir definitivamente"}
            </button>
          </div>
        </section>
      </div>,
      document.body,
    ) : null}
  </>;
}
