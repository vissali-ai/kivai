"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, CheckCircle2, CircleAlert, Link2, RefreshCcw, ShieldCheck, Unplug,
} from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
import { buildCampaignDiagnostics, inspectPeriod, type MonthlyGoals } from "@/lib/google-ads/diagnostics";
import { campaignNeedsContext, describeCampaignChannel } from "@/lib/google-ads/campaign-report";
import { parseGoogleAdsChannel } from "@/lib/google-ads/campaign-types";
import { GoogleAdsDiagnosticFeed } from "@/components/tools/google-ads-diagnostic-feed";
import type { TrafficAnalysisRequest } from "@/lib/ai/traffic-analysis";

type ConnectedUser = { id: string; connected_at: string };
type LinkedAccount = {
  customerId: string;
  loginCustomerId: string | null;
  name: string;
  manager: boolean;
  currencyCode: string | null;
  timeZone: string | null;
};
type CampaignMetric = {
  id: string;
  name: string;
  channel: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
};
type LiveReport = {
  account: LinkedAccount;
  from: string;
  to: string;
  campaigns: CampaignMetric[];
  totals: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionValue: number;
  };
};

const toolPath = "/ferramentas/analisador-de-trafego-pago-google-ads";
const loginHref = "/conta/login?next=" + encodeURIComponent(toolPath + "?connect_google_ads=1");

function bearer() {
  const token = getStoredSession()?.access_token;
  return token ? { Authorization: "Bearer " + token } : null;
}

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const auth = bearer();
  if (!auth) throw new Error("Entre na sua conta Kivai para continuar.");
  const response = await fetch(url, {
    ...init, cache: "no-store",
    headers: { ...auth, ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "A conexão com o Google Ads não pôde ser consultada.");
  return data;
}

function fmt(value: number, currency = "BRL") {
  return value.toLocaleString("pt-BR", { style: "currency", currency });
}
function num(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function GoogleAdsLiveConnect({ goals, period, onSnapshot }: {
  goals: MonthlyGoals;
  period: { from: string; to: string };
  onSnapshot?: (snapshot: TrafficAnalysisRequest["snapshot"] | null) => void;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [available, setAvailable] = useState(false);
  const [setupHint, setSetupHint] = useState("");
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);
  const [connectionId, setConnectionId] = useState("");
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [partialAccounts, setPartialAccounts] = useState(false);
  const [accountFilter, setAccountFilter] = useState("");
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<LiveReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const isAuthed = Boolean(bearer());
    setAuthenticated(isAuthed);
    if (!isAuthed) { setConnectionsLoaded(false); return; }
    try {
      const response = await getJson<{ connections: ConnectedUser[] }>(
        "/api/integrations/google-ads/connections",
      );
      setConnections(response.connections);
      setConnectionsLoaded(true);
      setConnectionId((current) =>
        response.connections.some((item) => item.id === current)
          ? current : (response.connections[0]?.id ?? ""),
      );
    } catch (cause) {
      setConnectionsLoaded(false);
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar conexões.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const status = await fetch("/api/integrations/google-ads/status", { cache: "no-store" });
        const data = await status.json() as { available?: boolean; missingConfiguration?: string };
        setAvailable(data.available === true);
        setSetupHint(data.missingConfiguration || "");
      } catch {
        setSetupHint("indisponivel");
      }
      await refresh();
    })();
  }, [refresh]);

  // Fluxo opcional iniciado pelo próprio usuário: entrar no Kivai e seguir
  // para a autorização Google Ads somente quando não existe conexão salva.
  // A URL é consumida antes de iniciar o OAuth para evitar loops de consentimento.
  useEffect(() => {
    if (!connectionsLoaded || authenticated !== true || !available) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("connect_google_ads") !== "1") return;
    url.searchParams.delete("connect_google_ads");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    if (connections.length > 0) return;

    setLoading(true);
    setError("");
    void (async () => {
      try {
        const result = await getJson<{ authorizationUrl: string }>(
          "/api/integrations/google-ads/start", { method: "POST" },
        );
        const authorization = new URL(result.authorizationUrl);
        if (authorization.origin !== "https://accounts.google.com") {
          throw new Error("Endereço de autorização inesperado.");
        }
        window.location.assign(authorization.toString());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a autorização.");
        setLoading(false);
      }
    })();
  }, [authenticated, available, connectionsLoaded, connections.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const outcome = url.searchParams.get("google_ads_connection");
    if (!outcome) return;
    if (outcome === "connected") setMessage("Autorização Google Ads recebida. Selecione a conta para analisar.");
    else if (outcome === "denied") setError("A autorização foi cancelada. Nenhuma conta foi conectada.");
    else setError("A autorização não pôde ser concluída. Confira credenciais, permissões e o banco.");
    url.searchParams.delete("google_ads_connection");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, []);

  useEffect(() => {
    setAccounts([]); setSelected(""); setReport(null);
    onSnapshot?.(null);
    if (!connectionId) return;
    let ignored = false;
    setLoadingAccounts(true); setError("");
    void (async () => {
      try {
        const result = await getJson<{ accounts: LinkedAccount[]; partial: boolean }>(
          "/api/integrations/google-ads/accounts?connectionId=" + encodeURIComponent(connectionId),
        );
        if (!ignored) {
          setAccounts(result.accounts);
          setPartialAccounts(result.partial);
        }
      } catch (cause) {
        if (!ignored) setError(cause instanceof Error ? cause.message : "Falha ao listar contas.");
      } finally {
        if (!ignored) setLoadingAccounts(false);
      }
    })();
    return () => { ignored = true; };
    // A substituição da conta é controlada explicitamente por connectionId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  const readableAccounts = useMemo(() => {
    const query = accountFilter.trim().toLocaleLowerCase("pt-BR");
    return accounts.filter((account) =>
      !query ||
      account.name.toLocaleLowerCase("pt-BR").includes(query) ||
      account.customerId.includes(query),
    );
  }, [accounts, accountFilter]);

  const snapshot = useMemo((): TrafficAnalysisRequest["snapshot"] | null => {
    if (!report) return null;
    const byType = new Map<string, { channel: string; cost: number; conversions: number; clicks: number }>();
    for (const campaign of report.campaigns) {
      const previous = byType.get(campaign.channel) ??
        { channel: campaign.channel, cost: 0, conversions: 0, clicks: 0 };
      previous.cost += campaign.cost;
      previous.conversions += campaign.conversions;
      previous.clicks += campaign.clicks;
      byType.set(campaign.channel, previous);
    }
    return {
      from: report.from, to: report.to, source: "google_ads_api",
      timeZone: report.account.timeZone || "America/Sao_Paulo", goals,
      totals: { ...report.totals, campaignCount: report.campaigns.length },
      channels: [...byType.values()],
    };
  }, [goals, report]);

  useEffect(() => {
    onSnapshot?.(snapshot);
  }, [onSnapshot, snapshot]);

  const diagnostics = snapshot ? buildCampaignDiagnostics({
    goals: snapshot.goals, totals: snapshot.totals,
    start: snapshot.from, end: snapshot.to,
    currencyCode: report?.account.currencyCode ?? undefined,
  }) : null;

  async function beginConsent() {
    setLoading(true); setError(""); setMessage("");
    try {
      const result = await getJson<{ authorizationUrl: string }>(
        "/api/integrations/google-ads/start", { method: "POST" },
      );
      const target = new URL(result.authorizationUrl);
      if (target.origin !== "https://accounts.google.com") {
        throw new Error("Endereço de autorização inesperado.");
      }
      window.location.assign(target.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a autorização.");
      setLoading(false);
    }
  }

  useEffect(() => {
    // Período novo invalida a análise anterior para impedir comparações de datas diferentes.
    setReport(null);
  }, [period.from, period.to]);

  async function loadReport() {
    const account = accounts.find((item) => item.customerId === selected && !item.manager);
    if (!account || !connectionId) return;
    if (!inspectPeriod(period.from, period.to).valid) {
      setError("Escolha um período válido de até 366 dias antes de consultar os dados.");
      return;
    }
    setLoadingReport(true); setReport(null); setError(""); setMessage("");
    try {
      const result = await getJson<LiveReport>("/api/integrations/google-ads/report", {
        method: "POST", body: JSON.stringify({
          connectionId, customerId: account.customerId, loginCustomerId: account.loginCustomerId,
          from: period.from, to: period.to,
        }),
      });
      setReport(result);
      setMessage("Relatório atualizado com os dados disponíveis na Google Ads API.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao importar relatório.");
    } finally {
      setLoadingReport(false);
    }
  }

  async function disconnect() {
    if (!connectionId || !window.confirm(
      "Desconectar esta autorização Google Ads do Kivai? " +
      "Os tokens armazenados serão removidos. Você poderá revogar o acesso também nas permissões da sua conta Google.",
    )) return;
    setLoading(true); setError("");
    try {
      await getJson("/api/integrations/google-ads/connections", {
        method: "DELETE", body: JSON.stringify({ connectionId }),
      });
      setAccounts([]); setReport(null); setSelected("");
      await refresh();
      setMessage("Conexão removida do Kivai. Para revogar o consentimento também no Google, acesse myaccount.google.com/permissions.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao desconectar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-primary/25 bg-primary/[0.03] p-5 sm:p-7"
      aria-labelledby="google-ads-live-title">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Link2 className="size-4" /> Integração Google Ads
      </p>
      <h2 id="google-ads-live-title" className="mt-2 text-xl font-semibold sm:text-2xl">
        Conectar contas reais do Google Ads
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
        Autorize sua conta Google, escolha um cliente ou conta vinculada à MCC e
        consulte o período escolhido acima, até o último dia concluído no fuso da conta. O Kivai
        apenas lê dados. Não altera lances, anúncios, palavras-chave nem orçamentos.
      </p>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
        Integração em teste: somente contas Google cadastradas como usuárias de teste
        podem autorizar o acesso nesta fase. O Google pode exibir uma permissão ampla
        para visualizar, editar, criar e excluir dados, mas o Kivai utiliza apenas
        consultas de leitura. Leia a <Link href="/privacidade" className="underline underline-offset-2">
        Política de Privacidade</Link> antes de conectar.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {authenticated === false ? (
          <Link href={loginHref} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            Entrar no Kivai e conectar Google Ads
          </Link>
        ) : (
          <button type="button" onClick={beginConsent}
            disabled={!available || loading || authenticated !== true}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Link2 className="size-4" />
            {loading ? "Aguarde..." : "Conectar Google Ads"}
          </button>
        )}
        {authenticated && connections.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="size-4" /> {connections.length} conexão(ões) autorizada(s)
          </span>
        ) : null}
      </div>
      {!available ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 p-3 text-xs leading-6 text-amber-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {setupHint === "encryption" ?
            "A conexão aguarda a chave de criptografia segura no servidor para proteger os tokens OAuth." :
            "O recurso está sendo preparado. A conexão só será ativada quando o OAuth, a criptografia e o banco forem validados."}
        </p>
      ) : null}
      {message ? <p className="mt-4 rounded-lg border border-white/10 p-3 text-xs leading-6">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-500/20 p-3 text-xs leading-6 text-red-300">{error}</p> : null}

      {connections.length > 0 ? (
        <div className="mt-7 rounded-xl border border-white/10 bg-background p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="block w-full max-w-sm text-xs font-medium text-muted-foreground">
              Autorização vinculada
              <select value={connectionId} onChange={(event) => setConnectionId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/15 bg-background px-3 py-2.5 text-sm text-foreground">
                {connections.map((conn, i) => (
                  <option key={conn.id} value={conn.id}>
                    Conexão {i + 1} · {new Date(conn.connected_at).toLocaleDateString("pt-BR")}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={disconnect} disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
              <Unplug className="size-4" /> Desconectar
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-medium text-muted-foreground" htmlFor="google-ads-filter">
              Buscar cliente ou número da conta
            </label>
            <input id="google-ads-filter" value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/15 bg-background px-3 py-2.5 text-sm text-foreground"
              placeholder="Ex.: clínica, loja ou ID da conta" />
            {loadingAccounts ? (
              <p className="mt-3 text-xs text-muted-foreground">Consultando suas contas e hierarquia MCC...</p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {accounts.length} conta(s) encontradas.
                {partialAccounts ? " A lista pode estar parcial devido aos limites de consulta." : ""}
              </p>
            )}
          </div>
          {readableAccounts.length > 0 ? (
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {readableAccounts.map((account) => {
                const key = account.customerId;
                return (
                  <label key={key} className={"flex cursor-pointer items-start gap-3 rounded-lg border p-3 " +
                    (selected === key ? "border-primary/50 bg-primary/[0.06]" : "border-white/10")}>
                    <input type="radio" className="mt-1 size-4 accent-primary" name="google_ads_account"
                      value={key} checked={selected === key} disabled={account.manager}
                      onChange={() => { setSelected(key); setReport(null); }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{account.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        ID {account.customerId} · {account.manager ? "Administrador MCC" : "Conta anunciante"}
                        {account.currencyCode ? " · " + account.currencyCode : ""}
                        {account.timeZone ? " · " + account.timeZone : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}
          <button type="button" onClick={loadReport}
            disabled={!selected || loadingReport || !available || !inspectPeriod(period.from, period.to).valid}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-2.5 text-sm font-medium text-primary disabled:opacity-50">
            <RefreshCcw className="size-4" />
            {loadingReport ? "Consultando Google Ads..." : "Analisar período selecionado"}
          </button>
        </div>
      ) : null}

      {report && snapshot && diagnostics ? (
        <div className="mt-7 rounded-xl border border-white/10 bg-background p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{report.account.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Dados da API de {report.from} até {report.to} ·
                {report.account.currencyCode ? " Moeda " + report.account.currencyCode : " Moeda não informada"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Fonte Google Ads API
            </span>
          </div>
          {report.account.currencyCode && report.account.currencyCode !== "BRL" ? (
            <p className="mt-4 rounded-lg border border-amber-400/20 p-3 text-xs leading-6 text-amber-200">
              A conta utiliza {report.account.currencyCode}. Preencha todas as metas financeiras na
              mesma moeda. O relatório não converte moedas automaticamente.
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Campanhas", value: String(report.campaigns.length) },
              { label: "Gasto", value: fmt(report.totals.cost, report.account.currencyCode || "BRL") },
              { label: "Conversões", value: num(report.totals.conversions) },
              { label: "CPA médio", value: report.totals.conversions > 0
                ? fmt(report.totals.cost / report.totals.conversions, report.account.currencyCode || "BRL") : "N/D" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-2 break-words text-lg font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <h4 className="text-sm font-semibold">Metas proporcionais de {report.from} a {report.to}</h4>
            {Object.values(diagnostics.pacing).filter((x): x is NonNullable<typeof x> => x !== null)
              .map((item) => (
                <div key={item.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.unit === "count" ? num(item.actual) : fmt(item.actual, report.account.currencyCode || "BRL")}
                    {" / "}
                    {item.unit === "count" ? num(item.expectedToDate) : fmt(item.expectedToDate, report.account.currencyCode || "BRL")}
                    {" · "}
                    {item.differencePct >= 0 ? "+" : ""}{num(item.differencePct)}%
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold">Modalidades encontradas e pontos de atenção</h4>
            {Array.from(new Set(report.campaigns.map((c) => c.channel))).map((channel) => {
              const type = parseGoogleAdsChannel(channel);
              const sample = report.campaigns.find((c) => c.channel === channel);
              const guidance = sample ? campaignNeedsContext({
                name: sample.name, channel: type, rows: 1, impressions: sample.impressions,
                clicks: sample.clicks, cost: sample.cost, conversions: sample.conversions,
                conversionValue: sample.conversionValue,
              }) : [];
              return (
                <div key={channel} className="rounded-lg border border-white/10 p-3 text-xs">
                  <p className="font-semibold">{describeCampaignChannel(type).label}</p>
                  <p className="mt-1 text-muted-foreground">{describeCampaignChannel(type).focus}</p>
                  {guidance.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    {guidance.map((item, i) => <li key={i}>{item}</li>)}
                  </ul> : null}
                </div>
              );
            })}
          </div>
          <GoogleAdsDiagnosticFeed insights={diagnostics.insights} title="Diagnóstico automático de metas da conta conectada" />
          <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            A API informa conversões, não necessariamente leads qualificados. Confirme a definição no plano.
            Relatórios avançados de anúncios, públicos, recomendações oficiais e recursos serão incorporados depois.
          </p>
        </div>
      ) : null}
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        A integração de Google Ads solicita a permissão de leitura e gerenciamento apresentada pelo Google.
        O Kivai não implementa métodos de alteração de campanha. Você pode remover a conexão aqui e
        também revogar o acesso pelo Google.
        {" "}
        <a className="inline-flex items-center gap-1 text-primary hover:underline"
          href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
          Permissões da Conta Google <ArrowUpRight className="size-3" />
        </a>
      </p>
    </section>
  );
}
