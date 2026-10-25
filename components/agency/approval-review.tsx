"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalRecord } from "@/lib/agency/approval-schema";

export function ApprovalReview({ approval, token, active }: { approval: ApprovalRecord; token: string; active: boolean }) {
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(approval.status);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const canReview = active && status === "pending";

  async function decide(decision: "approved" | "changes_requested") {
    if (!name.trim() || (decision === "changes_requested" && feedback.trim().length < 5)) {
      setError("Informe seu nome e, para solicitar ajustes, escreva o que deve ser modificado."); return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/agency/approvals/decision", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ token, reviewerName: name.trim(), decision, feedback: feedback.trim() }),
      });
      const data = await response.json() as { status?: "approved" | "changes_requested"; error?: string };
      if (!response.ok || !data.status) throw Error(data.error ?? "Não foi possível confirmar.");
      setStatus(data.status);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao registrar a decisão."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-background px-4 pb-16 pt-28 text-foreground sm:px-6">
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="size-4" /> Kivai Aprova</p>
        <h1 className="text-3xl font-semibold tracking-tight">Revisão de publicação</h1>
        <p className="text-sm leading-6 text-muted-foreground">Confira a versão enviada por sua agência antes de aprovar ou solicitar alterações. Você não precisa criar uma conta.</p>
      </header>
      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="space-y-2 border-b border-border p-5">
          <p className="text-xs font-semibold uppercase text-primary">{approval.clientName} · {approval.platform}</p>
          <h2 className="text-xl font-semibold">{approval.title}</h2>
          <p className="text-xs text-muted-foreground">Versão {approval.version} · Link válido até {new Date(approval.expiresAt).toLocaleDateString("pt-BR")}</p>
        </div>
        {approval.mediaDataUrl ? <div className="border-b border-border bg-muted/20 p-4"><Image src={approval.mediaDataUrl} unoptimized width={900} height={900} alt="Arte enviada para aprovação" className="mx-auto h-auto max-h-[560px] w-auto max-w-full rounded-md object-contain" /></div> : null}
        {approval.caption ? <div className="p-5"><h3 className="mb-2 font-semibold">Legenda proposta</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{approval.caption}</p></div> : null}
      </article>
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        {!canReview ? <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-primary" /> {status === "approved" ? "Conteúdo aprovado" : status === "changes_requested" ? "Alterações solicitadas" : status === "revoked" ? "Link revogado" : "Link encerrado"}</div>
          <p className="text-sm text-muted-foreground">{status === "pending" ? "Este link expirou. Solicite uma nova versão à agência." : "Esta solicitação não aceita novas respostas. Entre em contato com a agência se precisar de uma nova revisão."}</p>
        </div> : <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sua decisão</h2>
          <label className="block text-sm font-medium">Seu nome<input value={name} onChange={event => setName(event.target.value)} maxLength={120} placeholder="Nome de quem está revisando" className="mt-2 min-h-11 w-full rounded-md border border-input bg-background p-3" /></label>
          {editMode ? <label className="block text-sm font-medium">O que precisa ser alterado?<textarea rows={4} maxLength={3000} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Ex.: substituir a imagem e atualizar a legenda..." className="mt-2 w-full rounded-md border border-input bg-background p-3" /></label> : null}
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy || name.trim().length < 2} onClick={() => void decide("approved")}><CheckCircle2 className="mr-2 size-4" /> Aprovar publicação</Button>
            {editMode ? <Button variant="outline" disabled={busy || name.trim().length < 2 || feedback.trim().length < 5} onClick={() => void decide("changes_requested")}><MessageSquareText className="mr-2 size-4" /> Enviar ajustes</Button> : <Button variant="outline" onClick={() => setEditMode(true)}><MessageSquareText className="mr-2 size-4" /> Solicitar alterações</Button>}
          </div>
          <p className="text-xs text-muted-foreground">Seu nome será registrado como informado. O link não verifica sua identidade; não o compartilhe com terceiros.</p>
        </div>}
        {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      </section>
      <p className="text-center text-xs text-muted-foreground">Revisão privada por link. <Link href="/" className="underline">Kivai</Link> não publica automaticamente este conteúdo.</p>
    </div>
  </main>;
}
