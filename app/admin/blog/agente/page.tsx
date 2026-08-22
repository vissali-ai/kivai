import { Clock3, Rss } from "lucide-react";
import { IncrementalList } from "@/components/admin/incremental-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listNewsSources, listRecentAgentRuns } from "@/lib/news-agent/repository";

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
  const [sourceResult, runResult] = await Promise.allSettled([listNewsSources(), listRecentAgentRuns()]);
  if (sourceResult.status === "rejected" || runResult.status === "rejected") migrationReady = false;
  const sources = sourceResult.status === "fulfilled" ? sourceResult.value : [];
  const runs = runResult.status === "fulfilled" ? runResult.value : [];
  return <main>
    <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Automação editorial</p><h1 className="mt-1 text-3xl font-semibold">Radar de pautas</h1></header>
    {!migrationReady ? <div className="mb-5 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><strong>Aplique a migração pendente:</strong> <code>supabase/migrations/003_news_agent.sql</code>.</div> : null}
    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Rss className="size-4 text-primary" />Fontes monitoradas</CardTitle></CardHeader><CardContent><IncrementalList emptyMessage="Nenhuma fonte disponível.">{sources.map((source) => <div key={source.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{source.name}</p><Badge variant="outline">{source.kind === "rss" ? "RSS" : source.kind === "sitemap" ? "Sitemap" : "Página"}</Badge></div><p className="mt-1 max-w-md truncate text-xs text-muted-foreground">{source.feedUrl}</p></div><Badge variant="outline">{source.enabled ? "Ativa" : "Pausada"}</Badge></div>)}</IncrementalList></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />Últimas execuções</CardTitle></CardHeader><CardContent><IncrementalList emptyMessage="O agente ainda não foi executado.">{runs.map((run) => <div key={run.id} className="border-b border-white/5 pb-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{formatDate(run.startedAt)}</p><Badge variant="outline">{run.status === "completed" ? "Concluída" : run.status === "failed" ? "Falhou" : "Executando"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{run.draftsCreated} pauta(s) coletada(s) · {run.itemsFound} item(ns) encontrado(s) · {run.itemsSkipped} ignorado(s)</p>{run.error ? <p className="mt-1 text-xs text-red-300">{run.error}</p> : null}</div>)}</IncrementalList></CardContent></Card>
    </div>
  </main>;
}
