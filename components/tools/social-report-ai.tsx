"use client";

import { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import type { SocialReportAiInput, SocialReportAiInsight } from "@/lib/ai/social-report";

type Result = { fingerprint: string; analysis: SocialReportAiInsight };

export function SocialReportAi({ input, onInsert }: { input: SocialReportAiInput; onInsert: (analysis: SocialReportAiInsight) => void }) {
  const [result, setResult] = useState<Result | null>(null);
  const [insertedFingerprint, setInsertedFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fingerprint = JSON.stringify(input);
  const visible = result?.fingerprint === fingerprint ? result.analysis : null;
  const hasMetrics = [input.metrics.reach, input.metrics.impressions, input.metrics.followersEnd, input.metrics.interactions, input.metrics.publications, input.metrics.leads, input.metrics.revenue].some((metric) => metric !== null);

  async function analyze() {
    setError("");
    const session = getStoredSession();
    if (!session?.access_token) {
      setError("Faça login no Kivai para utilizar a análise inteligente.");
      return;
    }
    if (!hasMetrics) {
      setError("Preencha pelo menos uma métrica antes de solicitar a análise.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/social-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({})) as {
        analysis?: SocialReportAiInsight;
        error?: string;
      };
      if (!response.ok || !payload.analysis) {
        setError(payload.error || "Não foi possível concluir a análise.");
        return;
      }
      setResult({ fingerprint, analysis: payload.analysis });
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }

  return (
    <section data-print-hide className="space-y-4" aria-labelledby="social-report-ai-heading">
      <div className="border border-border bg-card p-4 sm:p-6">
        <h2 id="social-report-ai-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          Análise inteligente com IA
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Receba uma leitura dos indicadores e sugestões práticas.
        </p>
      </div>
      <AiCreditBalance />
      <div className="flex justify-end">
        <Button type="button" onClick={analyze} disabled={loading || !hasMetrics} className="w-full sm:w-auto">
          {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {loading ? "Analisando…" : visible ? "Atualizar análise · 1 crédito" : "Analisar com IA · 1 crédito"}
        </Button>
      </div>
      <details className="text-xs leading-5 text-muted-foreground">
        <summary className="cursor-pointer font-medium">Privacidade e uso dos dados</summary>
        <p className="mt-2">
          Somente indicadores agregados, período e rede social são enviados a um serviço externo de IA após seu clique.
          Não enviamos nomes de clientes, perfis, observações ou links. Na modalidade gratuita, o provedor pode utilizar os dados enviados para melhorar seus produtos.
          A análise pode conter erros e não substitui a avaliação profissional.
        </p>
      </details>
      {error && <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {visible && (
        <div className="space-y-4 border border-border bg-card p-4 sm:p-6" aria-live="polite">
          <div>
            <h3 className="font-semibold">Resumo dos resultados</h3>
            <p className="mt-1 text-sm leading-6">{visible.summary}</p>
          </div>
          {visible.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold">Pontos positivos</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{visible.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </div>
          )}
          {visible.attention.length > 0 && (
            <div>
              <h3 className="font-semibold">Pontos de atenção</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{visible.attention.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Próximas ações sugeridas</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{visible.actions.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            <p className="flex-1 text-xs text-muted-foreground">
              A análise é uma sugestão. Revise os textos antes de exportar ou apresentar ao cliente.
            </p>
            <Button type="button" variant="outline" disabled={insertedFingerprint === fingerprint}
              onClick={() => { onInsert(visible); setInsertedFingerprint(fingerprint); }}>
              {insertedFingerprint === fingerprint ? "Adicionado ao relatório" : "Inserir diagnóstico e plano no relatório"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
