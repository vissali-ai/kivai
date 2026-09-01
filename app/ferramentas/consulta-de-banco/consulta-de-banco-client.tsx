"use client";

import { FormEvent, useRef, useState } from "react";
import { Check, Copy, Loader2, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

type BankData = { ispb?: string; name?: string; code?: number; fullName?: string };
const display = (value?: string | number | null) => value === undefined || value === null || value === "" ? "Não informado" : String(value);

export default function ConsultaDeBancoClient() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<BankData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);
    const normalized = code.replace(/\D/g, "");
    if (!normalized) {
      setError("Informe o código do banco.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/consulta-banco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const payload = await response.json().catch(() => null) as BankData | { error?: string } | null;
      if (!response.ok) {
        setError(payload && "error" in payload && payload.error ? payload.error : "Não foi possível realizar a consulta.");
        return;
      }
      setResult(payload as BankData);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch {
      setError("Não foi possível conectar ao serviço de consulta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText([
        `Código: ${display(result.code)}`,
        `Nome: ${display(result.name)}`,
        `Nome completo: ${display(result.fullName)}`,
        `ISPB: ${display(result.ispb)}`,
      ].join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar os dados.");
    }
  }

  function reset() {
    setCode("");
    setResult(null);
    setError("");
    setCopied(false);
  }

  return (
    <ToolPageShell
      title="Consulta de Banco"
      description="Consulte dados de bancos e instituições financeiras a partir do código bancário."
      categoryName="Empresarial"
      categoryHref="/ferramentas"
      processingMode="server"
      privacyMessage="O código informado é enviado à BrasilAPI para consulta. O Kivai não salva o resultado da consulta."
    >
      <Card>
        <CardHeader>
          <CardTitle>Consultar banco</CardTitle>
          <CardDescription>Digite o código numérico do banco e consulte os dados disponíveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="bank-code" className="text-sm font-medium">Código do banco</label>
              <input
                id="bank-code"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setResult(null); setError(""); }}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="001"
                className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Exemplo: 001 para o Banco do Brasil.</p>
            </div>
            <div className="flex items-end gap-2 sm:shrink-0">
              <Button type="submit" size="lg" disabled={loading || !code.replace(/\D/g, "")}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {loading ? "Consultando..." : "Consultar banco"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={reset} disabled={loading}>
                <RotateCcw className="size-4" />Limpar
              </Button>
            </div>
          </form>
          {error && <div role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">{error}</div>}
        </CardContent>
      </Card>

      {result && (
        <div ref={ref} className="mt-6">
          <Card>
            <CardHeader>
              <CardDescription>Banco consultado</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{display(result.fullName || result.name)}</CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{display(result.name)}</p>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Código do banco", display(result.code)],
                  ["Nome", display(result.name)],
                  ["Nome completo", display(result.fullName)],
                  ["ISPB", display(result.ispb)],
                ].map(([label, value]) => (
                  <div key={label} className="border border-border bg-muted/10 p-4">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5">
                <Button type="button" variant="outline" onClick={copy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Dados copiados" : "Copiar dados"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ToolPageShell>
  );
}