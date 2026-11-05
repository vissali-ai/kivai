"use client";

import { useState } from "react";
import { getStoredSession } from "@/lib/user-auth";
import { useAccountAccess } from "@/lib/billing/access-client";
import { subscriptionFeedbackReasons, type SubscriptionFeedbackReason } from "@/lib/billing/subscription-feedback";

export function SubscriptionFeedback() {
  const { access, loading } = useAccountAccess();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<SubscriptionFeedbackReason | "">("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const subscription = access?.subscription;
  if (loading || !subscription || (subscription.plan_code !== "pro" && subscription.plan_code !== "agency")) return null;
  const expired = access?.plan === "free";
  if (sent) return (
    <section aria-live="polite" className="rounded-xl border border-border bg-card p-4 text-sm">
      Obrigado por nos contar sua experiência. Sua resposta vai ajudar a melhorar o Kivai.
    </section>
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason || sending) return;
    const token = getStoredSession()?.access_token;
    if (!token) { setMessage("Entre novamente na conta para enviar sua resposta."); return; }
    setSending(true); setMessage("");
    try {
      const response = await fetch("/api/account/subscription-feedback", {
        method: "POST",
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment }),
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar a resposta.");
      setSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tente novamente.");
    } finally { setSending(false); }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span>
          <span className="block text-sm font-semibold">{expired ? "O que fez você não continuar no Kivai pago?" : "Como podemos melhorar sua assinatura?"}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">Uma pergunta rápida e opcional, sem alterar seu plano ou cobranças.</span>
        </span>
        <span aria-hidden="true" className="text-xl text-primary">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={submit}>
          <label htmlFor="subscription-feedback-reason" className="block text-sm font-medium">Qual é o principal motivo?</label>
          <select id="subscription-feedback-reason" value={reason} onChange={event => setReason(event.target.value as SubscriptionFeedbackReason | "")} required className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Selecione uma opção</option>
            {Object.entries(subscriptionFeedbackReasons).map(([code, label]) => <option value={code} key={code}>{label}</option>)}
          </select>
          <label htmlFor="subscription-feedback-comment" className="block text-sm font-medium">Quer explicar melhor? (opcional)</label>
          <textarea id="subscription-feedback-comment" value={comment} onChange={event => setComment(event.target.value)} maxLength={500} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="O que faltou ou poderia ser melhor?" />
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={!reason || sending} type="submit" className="min-h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{sending ? "Enviando..." : "Enviar resposta"}</button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-10 px-2 text-sm text-muted-foreground">Agora não</button>
          </div>
          {message ? <p role="alert" className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
