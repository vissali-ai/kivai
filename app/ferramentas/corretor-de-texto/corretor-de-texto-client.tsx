"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Clipboard, Copy, Eraser, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedProjects } from "@/components/account/saved-projects";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { getStoredSession } from "@/lib/user-auth";
import type { ProofreaderOutput } from "@/lib/ai/text-proofreader";

const KEY = "kivai:corretor-de-texto:pending";
const tones = [
  { value: "preservar", label: "Preservar meu estilo" },
  { value: "formal", label: "Formal" },
  { value: "profissional", label: "Profissional" },
  { value: "casual", label: "Casual" },
  { value: "academico", label: "Acadêmico" },
];

export default function CorretorDeTextoClient() {
  const [text, setText] = useState(() => { if (typeof window === "undefined") return ""; try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } });
  const [tone, setTone] = useState("preservar");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProofreaderOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const lock = useRef(false);

  function edit(next: string) {
    setText(next); setResult(null); setError(""); setCopied(false);
    try { sessionStorage.setItem(KEY, next); } catch { /* private mode */ }
  }

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    if (text.trim().length < 10 || text.length > 8000) { setError("Informe de 10 a 8.000 caracteres."); return; }
    const session = getStoredSession();
    if (!session?.access_token) { setError("Faça login para utilizar seus créditos gratuitos."); return; }
    lock.current = true; setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/ai/corretor-de-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({ text, tone, consent }),
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "Não foi possível corrigir o texto.");
      setResult(payload.result as ProofreaderOutput);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha na correção.");
    } finally {
      lock.current = false; setLoading(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }

  async function copyCorrected() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.correctedText); setCopied(true); }
    catch { setError("Não foi possível copiar automaticamente. Selecione o texto para copiar."); }
  }

  return <section className="mx-auto max-w-6xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
    <header className="mb-8 max-w-3xl">
      
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Corretor de Texto com IA</h1>
      <p className="mt-3 text-muted-foreground">Corrija ortografia, gramática, concordância e pontuação com inteligência artificial, preservando o sentido do seu texto.</p>
    </header>
    <SavedProjects kind="proofreader" payload={{ text, tone, result }} onLoad={value => {
      const saved = value as { text?: string; tone?: string; result?: ProofreaderOutput | null };
      if (typeof saved.text !== "string" || !tones.some(option => option.value === saved.tone)) return;
      edit(saved.text); setTone(saved.tone!); setResult(saved.result ?? null);
    }} />
    <Card>
      <CardHeader><CardTitle>Revisão inteligente</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={analyze} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="proofreader-text" className="font-medium">Seu texto</label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={async () => { try { edit(await navigator.clipboard.readText()); } catch { setError("Cole o conteúdo diretamente no campo."); } }}><Clipboard className="mr-1 size-4" />Colar</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => edit("")} disabled={!text}><Eraser className="mr-1 size-4" />Limpar</Button>
            </div>
          </div>
          <textarea id="proofreader-text" value={text} onChange={e => edit(e.target.value)} maxLength={8000} rows={10} placeholder="Digite ou cole o texto que deseja corrigir..." className="w-full resize-y rounded-lg border border-input bg-background p-4 text-sm leading-7" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{text.length.toLocaleString("pt-BR")} / 8.000 caracteres</span>
            <label className="flex items-center gap-2">Tom da revisão <select aria-label="Tom da revisão" value={tone} onChange={e => {setTone(e.target.value);setResult(null);}} className="rounded-md border border-input bg-background p-2 text-foreground">{tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          </div>
          <AiCreditBalance />
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>Autorizo enviar meu texto ao serviço externo de IA. Não incluí informações pessoais ou confidenciais.</span></label>
          <p className="text-xs text-muted-foreground">A revisão custa 1 crédito, inclusive para usuários com créditos gratuitos. O texto é enviado somente após seu consentimento. A IA pode cometer erros; revise o resultado antes de utilizar.</p>
          <Button type="submit" size="lg" disabled={loading || !consent || text.trim().length < 10}><Sparkles className="mr-2 size-4" />{loading ? "Corrigindo..." : "Corrigir texto com IA · 1 crédito"}</Button>
          {error && <p role="alert" className="text-sm text-destructive">{error} {error.includes("login") && <Link className="underline" href="/conta/login?next=%2Fferramentas%2Fcorretor-de-texto">Entrar ou cadastrar</Link>}</p>}
        </form>
      </CardContent>
    </Card>
    {result && <Card className="mt-6">
      <CardHeader><CardTitle>Resultado da revisão</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{result.summary}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div><h2 className="mb-2 font-semibold">Original</h2><div className="min-h-48 whitespace-pre-wrap break-words rounded-lg border p-4 text-sm leading-7">{text}</div></div>
          <div><h2 className="mb-2 font-semibold">Corrigido</h2><div className="min-h-48 whitespace-pre-wrap break-words rounded-lg border border-primary/30 bg-muted/20 p-4 text-sm leading-7">{result.correctedText}</div></div>
        </div>
        <Button type="button" variant="outline" onClick={copyCorrected}>{copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}{copied ? "Copiado" : "Copiar texto corrigido"}</Button>
        {result.changes.length > 0 && <div><h2 className="mb-3 font-semibold">Principais alterações explicadas</h2><div className="space-y-3">{result.changes.map((change,index) => <div className="rounded-lg border p-3 text-sm" key={index}><p><span className="text-muted-foreground line-through">{change.original}</span> → <strong>{change.replacement}</strong></p><p className="mt-1 text-muted-foreground">{change.explanation}</p></div>)}</div></div>}
      </CardContent>
    </Card>}
  </section>;
}
