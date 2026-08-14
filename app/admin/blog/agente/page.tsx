import { AlertTriangle, BarChart3, CheckCircle2, Clock3, MousePointerClick, Rss, Search } from "lucide-react";
import { NewsAgentPanel } from "@/components/admin/news-agent-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newsAgentConfig } from "@/lib/blog/config";
import { listNewsSources, listRecentAgentRuns } from "@/lib/news-agent/repository";
import { listRadarMetrics } from "@/lib/news-radar/repository";

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Data indisponível" : date.format(parsed);
}

export default async function NewsAgentPage() {
  let migrationReady = true;
  const [sourceResult, runResult, metricsResult] = await Promise.allSettled([listNewsSources(), listRecentAgentRuns(), listRadarMetrics(30)]);
  if (sourceResult.status === "rejected" || runResult.status === "rejected") migrationReady = false;
  const sources = sourceResult.status === "fulfilled" ? sourceResult.value : [];
  const runs = runResult.status === "fulfilled" ? runResult.value : [];
  const radarReady = metricsResult.status === "fulfilled";
  const metrics = metricsResult.status === "fulfilled" ? metricsResult.value : [];
  const radarTotals = metrics.reduce((total, metric) => ({
    searches: total.searches + metric.searches,
    results: total.results + metric.resultsReturned,
    cacheHits: total.cacheHits + metric.cacheHits,
    errors: total.errors + metric.errors,
    clicks: total.clicks + metric.outboundClicks,
  }), { searches: 0, results: 0, cacheHits: 0, errors: 0, clicks: 0 });
  const openAiReady = Boolean(newsAgentConfig.openAiApiKey);
  const cronReady = newsAgentConfig.cronSecret.length >= 32;
  const rssOnly = newsAgentConfig.mode === "rss";
  const canRun = migrationReady && (rssOnly || openAiReady);

  return <main>
    <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Automação editorial</p><h1 className="mt-1 text-3xl font-semibold">Agente de notícias</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Monitora RSS, sitemaps e páginas editoriais brasileiras, elimina duplicados e cria até 30 pautas para sua edição. Nenhum conteúdo é publicado automaticamente.</p></header>
    {!migrationReady ? <div className="mb-5 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><strong>Aplique a migração pendente:</strong> <code>supabase/migrations/003_news_agent.sql</code>.</div> : null}
    <div className="mb-5 grid gap-3 md:grid-cols-3">
      {[{ label: "Banco e fontes", ready: migrationReady }, { label: rssOnly ? "Modo sem IA" : "API de IA", ready: rssOnly || openAiReady }, { label: "Agendamento protegido", ready: cronReady }].map((item) => <Card key={item.label}><CardContent className="flex items-center justify-between p-4"><span className="text-sm">{item.label}</span>{item.ready ? <CheckCircle2 className="size-5 text-emerald-400" /> : <AlertTriangle className="size-5 text-amber-400" />}</CardContent></Card>)}
    </div>
    {!radarReady ? <div className="mb-5 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><strong>Aplique a migração do Radar:</strong> <code>supabase/migrations/011_news_radar_pilot.sql</code>.</div> : null}
    <NewsAgentPanel canRun={canRun} />
    <Card className="mt-6"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" />Radar público · últimos 30 dias</CardTitle></CardHeader><CardContent>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Buscas", value: radarTotals.searches, icon: Search },
          { label: "Resultados entregues", value: radarTotals.results, icon: Rss },
          { label: "Buscas via cache", value: radarTotals.cacheHits, icon: Clock3 },
          { label: "Cliques nas fontes", value: radarTotals.clicks, icon: MousePointerClick },
          { label: "Erros totais", value: radarTotals.errors, icon: AlertTriangle },
        ].map((item) => <div key={item.label} className="border border-border bg-muted/10 p-4"><item.icon className="size-4 text-primary" /><p className="mt-3 text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.label}</p></div>)}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Métricas agregadas por categoria e dia, sem armazenar IP ou identificador pessoal. A taxa de retorno exige comparação complementar no Google Analytics com consentimento.</p>
    </CardContent></Card>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Rss className="size-4 text-primary" />Fontes monitoradas</CardTitle></CardHeader><CardContent><div className="space-y-3">{sources.map((source) => <div key={source.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{source.name}</p><Badge variant="outline">{source.kind === "rss" ? "RSS" : source.kind === "sitemap" ? "Sitemap" : "Página"}</Badge></div><p className="mt-1 max-w-md truncate text-xs text-muted-foreground">{source.feedUrl}</p></div><Badge variant="outline">{source.enabled ? "Ativa" : "Pausada"}</Badge></div>)}{!sources.length ? <p className="text-sm text-muted-foreground">Nenhuma fonte disponível.</p> : null}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />Últimas execuções</CardTitle></CardHeader><CardContent><div className="space-y-3">{runs.map((run) => <div key={run.id} className="border-b border-white/5 pb-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{formatDate(run.startedAt)}</p><Badge variant="outline">{run.status === "completed" ? "Concluída" : run.status === "failed" ? "Falhou" : "Executando"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{run.draftsCreated} rascunho(s) · {run.itemsFound} item(ns) encontrado(s) · {run.itemsSkipped} ignorado(s)</p>{run.error ? <p className="mt-1 text-xs text-red-300">{run.error}</p> : null}</div>)}{!runs.length ? <p className="text-sm text-muted-foreground">O agente ainda não foi executado.</p> : null}</div></CardContent></Card>
    </div>
  </main>;
}
