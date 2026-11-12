"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { getStoredSession } from "@/lib/user-auth";

type Mode = "summary" | "transcript";
type Result = { text: string; mode: Mode; partial: boolean; source: string; model: string };

export default function YoutubeVideoPreviewClient() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("summary");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);

  async function run() {
    if (lock.current) return;
    const token = getStoredSession()?.access_token;
    if (!token) { setError("Entre na sua conta para testar a ferramenta."); return; }
    if (!consent) { setError("Autorize o envio do link para o Gemini."); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setResult(null);
    try {
      const response = await fetch("/api/ai/video-youtube-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, mode, consent }),
        signal: AbortSignal.timeout(58_000),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Falha ao analisar o vídeo.");
      setResult(json as Result);
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "O processamento demorou demais. Consulte o saldo antes de repetir.");
    } finally {
      lock.current = false;
      setBusy(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }

  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.text); setNotice("Texto copiado."); }
    catch { setError("Não foi possível copiar. Selecione o texto manualmente."); }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = result.mode === "summary" ? "resumo-video-kivai.txt" : "transcricao-video-kivai.txt";
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-5">
      <AiCreditBalance />
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Cole um link público do YouTube</h2>
          <p className="text-sm text-muted-foreground">Experimento em ambiente de teste. Suporta vídeos públicos, incluindo links Shorts. Não é necessário baixar o vídeo.</p>
        </div>
        <label htmlFor="youtube-link" className="block text-sm font-medium">URL do vídeo</label>
        <input
          id="youtube-link"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={busy}
          autoComplete="url"
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-3 text-sm"
          maxLength={300}
        />
        <fieldset className="space-y-2" disabled={busy}>
          <legend className="text-sm font-medium">O que deseja fazer?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["summary", "Resumo inteligente", "Resumo, assuntos principais e tempos relevantes"],
              ["transcript", "Transcrição", "Texto das falas, quando disponível no vídeo"],
            ] as const).map(([value, title, description]) => (
              <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${mode === value ? "border-primary bg-primary/5" : "border-border"}`}>
                <input type="radio" name="video-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-primary" />
                <span><strong className="block text-sm">{title}</strong><span className="text-xs text-muted-foreground">{description}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={busy} className="mt-1 accent-primary" />
          Autorizo o envio do link para o Google Gemini processar o vídeo.
        </label>
        <p className="text-xs text-muted-foreground">Teste com custo de 1 crédito por solicitação bem-sucedida. Em caso de falha, a reserva é devolvida. Não há garantia de transcrição literal ou completa em vídeos longos.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={busy || !url.trim() || !consent} onClick={() => void run()}>
            {busy ? "Analisando vídeo..." : mode === "summary" ? "Gerar resumo · 1 crédito" : "Transcrever · 1 crédito"}
          </Button>
          <Link href="/conta" className="text-sm underline">Entrar na conta</Link>
        </div>
        {busy && <p role="status" className="text-sm text-muted-foreground">A IA está processando o conteúdo. Vídeos longos podem ultrapassar o limite desta versão de teste.</p>}
      </section>
      {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-card p-4 text-sm">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm">{notice}</p>}
      {result && (
        <section aria-live="polite" className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">{result.mode === "summary" ? "Resumo do vídeo" : "Transcrição do vídeo"}</h2>
            <p className="mt-1 break-all text-xs text-muted-foreground">Fonte: {result.source}</p>
            {result.partial && <p role="status" className="mt-2 text-sm font-medium text-amber-700">A saída atingiu o limite de texto e pode estar incompleta.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void copy()}>Copiar texto</Button>
            <Button variant="outline" onClick={download}>Baixar TXT</Button>
          </div>
          <div className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 text-sm leading-7">{result.text}</div>
          <p className="text-xs text-muted-foreground">Texto gerado automaticamente pelo Gemini. Revise nomes, datas, falas e informações antes de utilizar ou publicar.</p>
        </section>
      )}
    </div>
  );
}
