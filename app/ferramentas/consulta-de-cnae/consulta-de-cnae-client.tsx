"use client";

import { FormEvent, ReactNode, useMemo, useRef, useState } from "react";
import { Check, Copy, Loader2, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

type CnaeLevel = { id?: string; descricao?: string };
type CnaeData = {
  id?: string;
  descricao?: string;
  grupo?: CnaeLevel & { divisao?: CnaeLevel & { secao?: CnaeLevel } };
  observacoes?: string[];
};

function normalizeClasse(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function display(value?: string | null) {
  return value ? value : "Não informado";
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight">{children}</h2>;
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-border bg-muted/10 p-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function ConsultaDeCnaeClient() {
  const [classe, setClasse] = useState("");
  const [result, setResult] = useState<CnaeData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const normalized = useMemo(() => normalizeClasse(classe), [classe]);

  function handleChange(value: string) {
    setClasse(normalizeClasse(value));
    setResult(null);
    setError("");
    setCopied(false);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);

    if (normalized.length !== 5) {
      setError("Informe um código CNAE de classe com 5 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/consulta-cnae", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classe: normalized }),
      });
      const payload = await response.json().catch(() => null) as CnaeData | { error?: string } | null;
      if (!response.ok) {
        setError(payload && "error" in payload && payload.error ? payload.error : "Não foi possível realizar a consulta.");
        return;
      }
      setResult(payload as CnaeData);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch {
      setError("Não foi possível conectar ao serviço de consulta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!result) return;
    const text = [
      `CNAE: ${display(result.id)}`,
      `Descrição: ${display(result.descricao)}`,
      `Grupo: ${display(result.grupo?.id)} - ${display(result.grupo?.descricao)}`,
      `Divisão: ${display(result.grupo?.divisao?.id)} - ${display(result.grupo?.divisao?.descricao)}`,
      `Seção: ${display(result.grupo?.divisao?.secao?.id)} - ${display(result.grupo?.divisao?.secao?.descricao)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar os dados.");
    }
  }

  function reset() {
    setClasse("");
    setResult(null);
    setError("");
    setCopied(false);
  }

  return (
    <ToolPageShell
      title="Consulta de CNAE"
      description="Consulte a classificação de uma atividade econômica pelo código CNAE e visualize sua hierarquia no IBGE."
      categoryName="Empresarial"
      categoryHref="/ferramentas"
      processingMode="server"
      privacyMessage="O código CNAE informado é enviado à BrasilAPI para consulta. O Kivai não salva o resultado da consulta."
    >
      <Card>
        <CardHeader>
          <CardTitle>Consultar CNAE</CardTitle>
          <CardDescription>Digite o código da classe CNAE com 5 dígitos, com ou sem formatação.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="cnae" className="text-sm font-medium">Código CNAE</label>
              <input
                id="cnae"
                name="cnae"
                value={classe}
                onChange={(event) => handleChange(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                placeholder="01113"
                aria-describedby="cnae-help"
                className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
              <p id="cnae-help" className="mt-2 text-xs leading-5 text-muted-foreground">
                A consulta usa a classe CNAE, como 01113. A BrasilAPI consulta dados provenientes do IBGE.
              </p>
            </div>
            <div className="flex items-end gap-2 sm:shrink-0">
              <Button type="submit" size="lg" disabled={loading || normalized.length !== 5}>
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
                {loading ? "Consultando..." : "Consultar CNAE"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={reset} disabled={loading}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Limpar
              </Button>
            </div>
          </form>
          {error ? <div role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      {result ? (
        <div ref={resultRef} className="space-y-6">
          <Card>
            <CardHeader>
              <CardDescription>CNAE consultado</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{display(result.id)}</CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{display(result.descricao)}</p>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Seção" value={<><strong>{display(result.grupo?.divisao?.secao?.id)}</strong><br />{display(result.grupo?.divisao?.secao?.descricao)}</>} />
                <InfoItem label="Divisão" value={<><strong>{display(result.grupo?.divisao?.id)}</strong><br />{display(result.grupo?.divisao?.descricao)}</>} />
                <InfoItem label="Grupo" value={<><strong>{display(result.grupo?.id)}</strong><br />{display(result.grupo?.descricao)}</>} />
                <InfoItem label="Classe" value={<><strong>{display(result.id)}</strong><br />{display(result.descricao)}</>} />
              </dl>
              <div className="mt-5">
                <Button type="button" variant="outline" onClick={copySummary}>
                  {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  {copied ? "Dados copiados" : "Copiar dados"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {result.observacoes?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Observações da atividade</CardTitle>
                <CardDescription>Informações associadas à classe CNAE consultada.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.observacoes.map((observacao, index) => (
                    <div key={index} className="border border-border bg-muted/10 p-4 text-sm leading-6 whitespace-pre-line">
                      {observacao}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </ToolPageShell>
  );
}
