"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { BrainCircuit, CircleHelp, FileUp, ShieldCheck, Sparkles } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
import {
  trafficReportKind,
  type TrafficAnalysisRequest,
  type TrafficAiOutput,
} from "@/lib/ai/traffic-analysis";
import { readTrafficManualReport } from "@/lib/google-ads/manual-report-reader";

type BetaWallet = { eligible: boolean; initial: number; remaining: number; activated?: boolean };
type SupportReport = TrafficAnalysisRequest["reports"][number] & {
  name: string; truncated: boolean;
};
type ReportKind = (typeof trafficReportKind.options)[number];

const reportSources: { kind: ReportKind; label: string; api: string; manual: string }[] = [
  { kind: "recomendacoes_google", label: "Recomendações da plataforma", api: "API, quando conectada", manual: "Recomendações > exportar tabela" },
  { kind: "anuncios_recursos", label: "Anúncios, recursos e reprovações", api: "API conforme modalidade", manual: "Anúncios e recursos > exportar" },
  { kind: "palavras_chave", label: "Palavras-chave, qualidade e lances", api: "API conforme modalidade", manual: "Palavras-chave > exportar tabela" },
  { kind: "termos_pesquisa", label: "Termos de pesquisa", api: "API parcial, depende da campanha", manual: "Termos de pesquisa > exportar" },
  { kind: "publicos_regioes", label: "Públicos, regiões e dispositivos", api: "API, nos segmentos compatíveis", manual: "Insights e relatórios > exportar" },
  { kind: "leilao", label: "Informações do leilão", api: "Exportação manual necessária", manual: "Informações do leilão > exportar" },
  { kind: "performance_max", label: "Performance Max e grupos de recursos", api: "API com relatórios próprios", manual: "Grupos de recursos e insights > exportar" },
  { kind: "outros", label: "Dados do CRM ou outros relatórios", api: "Depende da fonte externa", manual: "Exporte os números da fonte original" },
];

const actionLabel = {
  revisar_agora: "Revisar agora",
  investigar: "Investigar",
  aguardar: "Aguardar e monitorar",
  manter: "Manter",
  completar_dados: "Solicitar dados",
} as const;

const sourceLabel = {
  metas: "Plano do cliente",
  metricas_de_campanhas: "Métricas de campanhas",
  arquivo_complementar: "Relatório complementar",
} as const;

const analyzerPath = "/ferramentas/analisador-de-trafego-pago-google-ads";
const signupUrl = "/conta/cadastro?next=" + encodeURIComponent(analyzerPath);
const loginUrl = "/conta/login?next=" + encodeURIComponent(analyzerPath);

export function TrafficBetaAssistant({ snapshot }: {
  snapshot: TrafficAnalysisRequest["snapshot"] | null;
}) {
  const [logged, setLogged] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState<BetaWallet | null>(null);
  const [walletError, setWalletError] = useState("");
  const [kind, setKind] = useState<ReportKind>("recomendacoes_google");
  const [files, setFiles] = useState<SupportReport[]>([]);
  const [fileError, setFileError] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TrafficAiOutput | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const session = getStoredSession();
    if (!session?.access_token) {
      setLogged(false); setWallet(null); return;
    }
    setLogged(true);
    try {
      const response = await fetch("/api/ai/traffic-beta", {
        headers: { Authorization: "Bearer " + session.access_token }, cache: "no-store",
      });
      const data = await response.json().catch(() => ({})) as { wallet?: BetaWallet; error?: string };
      if (!response.ok || !data.wallet) throw new Error(data.error || "Saldo indisponível.");
      setWallet(data.wallet); setWalletError("");
    } catch (cause) {
      setWallet(null);
      setWalletError(cause instanceof Error ? cause.message : "Não foi possível consultar seus créditos.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addReport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileError(""); setAnalysis(null);
    if (files.length >= 3) { setFileError("Use no máximo três relatórios complementares por análise."); return; }
    try {
      const result = await readTrafficManualReport(file);
      setFiles((previous) => [...previous, {
        kind, content: result.content, name: file.name.slice(0, 100), truncated: result.truncated,
      }]);
    } catch (cause) {
      setFileError(cause instanceof Error ? cause.message : "Arquivo não suportado.");
    }
  }

  async function runAnalysis() {
    if (!snapshot || !consent || loading) return;
    const session = getStoredSession();
    if (!session?.access_token) { setError("Entre na conta para iniciar sua análise beta."); return; }
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const response = await fetch("/api/ai/traffic-beta/analyze", {
        method: "POST", cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          consent: true, snapshot,
          reports: files.map(({ kind, content }) => ({ kind, content })),
        } satisfies TrafficAnalysisRequest),
      });
      const payload = await response.json().catch(() => ({})) as { analysis?: TrafficAiOutput; error?: string };
      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "Não foi possível concluir a análise.");
      }
      setAnalysis(payload.analysis);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A análise está indisponível.");
    } finally {
      setLoading(false);
      await refresh();
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-primary/25 bg-primary/[0.03] p-5 sm:p-7" aria-labelledby="traffic-beta-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-4" aria-hidden="true" /> Acesso beta do Kivai
          </p>
          <h2 id="traffic-beta-heading" className="mt-2 text-2xl font-semibold">
            Analise campanhas com Gemini e receba recomendações explicadas
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            O Kivai combina as métricas importadas, o plano proporcional aos dias concluídos e
            relatórios complementares para propor ações, investigações ou recomendações de aguardar.
            A análise matemática e os arquivos locais não consomem crédito.
          </p>
        </div>
        <div className="rounded-xl border border-primary/10 bg-background p-4">
          <p className="text-xs text-muted-foreground">Bônus único da fase beta</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {wallet ? wallet.remaining : "10"} <span className="text-sm font-normal">créditos</span>
          </p>
          <p className="mt-1 max-w-48 text-xs leading-5 text-muted-foreground">
            1 crédito por diagnóstico concluído. O bônus não renova mensalmente.
          </p>
        </div>
      </div>

      {logged === false ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-background p-4">
          <Link href={signupUrl} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            Criar conta e experimentar
          </Link>
          <Link href={loginUrl} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium">
            Já tenho conta
          </Link>
          <p className="text-xs leading-5 text-muted-foreground">Uma cota de 10 créditos por conta com e-mail confirmado.</p>
        </div>
      ) : null}
      {wallet && !wallet.eligible ? (
        <p className="mt-5 rounded-lg border border-white/15 p-3 text-sm text-muted-foreground">
          Confirme o e-mail do cadastro para ativar seus créditos beta.
        </p>
      ) : null}
      {walletError && logged ? (
        <p className="mt-5 rounded-lg border border-amber-400/20 p-3 text-xs text-amber-200">
          {walletError} O acesso beta com IA depende da ativação da carteira promocional.
        </p>
      ) : null}

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <CircleHelp className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold">Que outros relatórios devo importar?</h3>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Com a conexão Google Ads API aprovada, o sistema buscará os indicadores permitidos automaticamente.
          Quando um dado não estiver disponível, ou enquanto a integração não estiver ativa,
          basta exportar o relatório correspondente no Google Ads. As opções abaixo indicam o nome habitual da área.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-[640px] w-full text-left text-xs">
            <thead className="bg-background text-muted-foreground">
              <tr><th className="p-3">Análise</th><th className="p-3">Pela API</th><th className="p-3">Se precisar baixar</th></tr>
            </thead>
            <tbody>
              {reportSources.map((source) => (
                <tr key={source.kind} className="border-t border-white/10">
                  <td className="p-3 font-medium">{source.label}</td>
                  <td className="p-3 text-muted-foreground">{source.api}</td>
                  <td className="p-3 text-muted-foreground">{source.manual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-white/10 bg-background p-5">
        <div className="flex items-center gap-2">
          <FileUp className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Relatórios complementares para o Gemini (opcional)</h3>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Você pode adicionar até três arquivos CSV, TSV ou XLSX por diagnóstico. Na versão beta,
          até 12 mil caracteres iniciais de cada arquivo são enviados para interpretação;
          se exceder o limite, a ferramenta avisará. Não envie listas com dados pessoais de leads.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.2fr]">
          <label className="text-xs font-medium text-muted-foreground">
            Origem do relatório
            <select className="mt-2 w-full rounded-lg border border-white/15 bg-background p-2.5 text-sm text-foreground"
              value={kind} onChange={(event) => setKind(event.target.value as ReportKind)}>
              {reportSources.map((source) => <option key={source.kind} value={source.kind}>{source.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Selecionar arquivo
            <input type="file" accept=".csv,.tsv,.txt,.xlsx" disabled={loading || files.length >= 3}
              onChange={addReport} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-background file:px-3 file:py-2 file:text-foreground" />
          </label>
        </div>
        {fileError ? <p role="alert" className="mt-3 text-xs text-red-400">{fileError}</p> : null}
        {files.length ? (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={file.name + index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
                <p className="min-w-0 flex-1 break-all text-xs">
                  {file.name}
                  {file.truncated ? <span className="ml-2 text-amber-300">Prévia parcial do arquivo</span> : null}
                </p>
                <button type="button" disabled={loading} onClick={() => setFiles((previous) => previous.filter((_, i) => i !== index))}
                  className="text-xs font-medium text-primary hover:underline">Remover</button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-2 text-xs leading-6 text-muted-foreground">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 accent-primary" />
        Autorizo o envio do resumo das campanhas, metas e conteúdos dos relatórios complementares
        selecionados ao Gemini para esta análise. Sei que são dados da minha conta ou de um cliente autorizado
        e que devo evitar informações pessoais ou confidenciais desnecessárias.
      </label>

      {!snapshot ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-background p-3 text-xs text-muted-foreground">
          Para pedir diagnóstico com IA, importe um CSV de campanhas ou conecte uma conta Google Ads e atualize suas métricas.
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Base numérica pronta: {snapshot.totals.campaignCount} campanha(s), de {snapshot.from} a {snapshot.to} · {snapshot.source === "google_ads_api" ? "Integração Google Ads" : "CSV importado"}.
        </p>
      )}
      <button type="button" onClick={runAnalysis}
        disabled={!snapshot || !consent || loading || !wallet?.eligible || wallet.remaining < 1}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
        <BrainCircuit className="size-4" aria-hidden="true" />
        {loading ? "Analisando dados..." : "Gerar diagnóstico com Gemini (1 crédito)"}
      </button>
      {error ? <p role="alert" className="mt-4 text-sm text-red-400">{error}</p> : null}
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
        Não aplicamos mudanças nem negativas automaticamente. Se a IA falhar, a reserva do crédito é devolvida.
      </p>

      {analysis ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-background p-5" aria-live="polite">
          <h3 className="text-lg font-semibold">Diagnóstico com Gemini</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{analysis.summary}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {analysis.recommendations.map((item, index) => (
              <article key={index} className="rounded-lg border border-white/10 p-4">
                <p className="text-xs font-medium text-primary">
                  {actionLabel[item.decision]} · Prioridade {item.priority}
                </p>
                <h4 className="mt-2 text-sm font-semibold">{item.title}</h4>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.finding}</p>
                <p className="mt-3 text-xs leading-6"><strong>Evidência: </strong>{item.evidence}</p>
                <p className="mt-2 text-xs leading-6"><strong>Recomendação: </strong>{item.recommendation}</p>
                <p className="mt-2 text-xs leading-6"><strong>Risco: </strong>{item.risk}</p>
                <p className="mt-3 text-[11px] text-muted-foreground">Origem indicada: {sourceLabel[item.source]}</p>
              </article>
            ))}
          </div>
          {analysis.missingData.length > 0 ? (
            <div className="mt-6 rounded-lg border border-white/10 p-4">
              <h4 className="text-sm font-semibold">Dados que podem aprimorar a análise</h4>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-6 text-muted-foreground">
                {analysis.missingData.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            Recomendações geradas por IA com base no material informado, sujeitas a falhas.
            Confira cada evidência no Google Ads antes de tomar decisões.
          </p>
        </div>
      ) : null}
    </section>
  );
}
