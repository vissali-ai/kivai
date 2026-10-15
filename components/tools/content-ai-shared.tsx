"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { getStoredSession } from "@/lib/user-auth";
import type { ContentAssistantInput, ContentAssistantResult } from "@/lib/ai/content-assistant";
import type { AssistantCopy } from "@/lib/ai/content-assistant-copy";

export function useContentAi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  async function generate(input: ContentAssistantInput): Promise<ContentAssistantResult | null> {
    if (inFlight.current) return null;
    setError("");
    const session = getStoredSession();
    if (!session?.access_token) { setError("Entre na sua conta para usar os créditos de IA."); return null; }
    inFlight.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/ai/content-assistant", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(input), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o conteúdo.");
      return data as ContentAssistantResult;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de conexão. Consulte o saldo antes de tentar novamente.");
      return null;
    } finally {
      inFlight.current = false;
      setLoading(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }
  return { loading, error, generate };
}

export function ContentAiFrame({ copy, consent, onConsent, loading, error, disabled, onGenerate, children }: {
  copy: AssistantCopy; consent: boolean; onConsent: (value: boolean) => void; loading: boolean; error: string;
  disabled: boolean; onGenerate: () => void; children: React.ReactNode;
}) {
  return <section data-print-hide className="space-y-4 border border-primary/25 bg-primary/5 p-4 sm:p-6" aria-label={copy.title}>
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 shrink-0 text-primary" aria-hidden="true" />{copy.title}</h2>
    <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>
    <AiCreditBalance />
    {children}
    <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={event => onConsent(event.target.checked)} className="mt-1 size-4 shrink-0" />Autorizo enviar o briefing preenchido ao serviço externo de IA para gerar sugestões. Não inclua dados pessoais ou informações confidenciais de clientes.</label>
    <p className="text-xs leading-5 text-muted-foreground">Na modalidade gratuita do provedor, os dados podem ser usados para melhorar seus produtos. Revise os rascunhos: a IA pode errar. Gerar custa 1 crédito da sua franquia ou saldo avulso; editar e aplicar o resultado não consome novos créditos. Limites de solicitações também se aplicam.</p>
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={onGenerate} disabled={disabled || !consent || loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{loading ? "Gerando sugestões…" : "Gerar sugestões · 1 crédito"}</Button>
      <Link className="text-sm text-primary underline" href="/conta/login">Entrar na conta</Link>
      {/^https:\/\//.test(copy.tutorialUrl) && <a className="text-sm text-primary underline" href={copy.tutorialUrl} target="_blank" rel="noopener noreferrer">Ver tutorial</a>}
    </div>
    {error && <p role="alert" className="border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
  </section>;
}
