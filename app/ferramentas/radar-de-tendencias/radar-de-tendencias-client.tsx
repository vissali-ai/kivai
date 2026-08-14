"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, ExternalLink, Flame, LoaderCircle, Radar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NEWS_RADAR_CATEGORIES,
  type NewsRadarCategory,
  type RadarItem,
  type RadarResponse,
} from "@/lib/news-radar/types";

type Status = "idle" | "loading" | "success" | "error";

function recordAnalyticsEvent(name: "radar_search" | "radar_source_click", parameters: Record<string, string | number | boolean>) {
  window.gtag?.("event", name, parameters);
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function relativeUpdate(value: string) {
  const minutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60_000), 0);
  if (minutes < 1) return "Atualizado agora";
  return `Atualizado há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

function recordOutboundClick(category: NewsRadarCategory, sourceName: string) {
  recordAnalyticsEvent("radar_source_click", { radar_category: category, source_name: sourceName });
  const payload = JSON.stringify({ category, sourceName });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/news-radar/click", new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch("/api/news-radar/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}

function NewsCard({ item, category }: { item: RadarItem; category: NewsRadarCategory }) {
  return (
    <article className="flex h-full flex-col border border-border bg-background p-5 transition-colors hover:border-primary/35">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-primary">{item.sourceName}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={item.publishedAt}>{dateTime.format(new Date(item.publishedAt))}</time>
        {item.coverageCount > 1 ? (
          <span className="inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">
            <Flame className="size-3" aria-hidden="true" />
            Em alta em {item.coverageCount} fontes
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-6 text-foreground">{item.title}</h3>
      {item.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.excerpt}</p> : null}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordOutboundClick(category, item.sourceName)}
        className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-primary hover:underline"
      >
        Ler na fonte original <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    </article>
  );
}

export function RadarDeTendenciasClient() {
  const [category, setCategory] = useState<NewsRadarCategory>("marketing");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RadarResponse | null>(null);
  const [error, setError] = useState("");
  const grouped = useMemo(() => ({
    today: result?.items.filter((item) => item.window === "today") ?? [],
    last24Hours: result?.items.filter((item) => item.window === "last-24-hours") ?? [],
  }), [result]);

  async function search() {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/news-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const body = await response.json() as RadarResponse | { error?: string };
      if (!response.ok || !("items" in body)) throw new Error("error" in body ? body.error : "Falha na busca.");
      recordAnalyticsEvent("radar_search", {
        radar_category: body.category,
        result_count: body.items.length,
        cache_hit: body.fromCache,
      });
      setResult(body);
      setStatus("success");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Não foi possível concluir a busca.");
      setStatus("error");
    }
  }

  return (
    <Card className="mx-auto max-w-5xl" aria-busy={status === "loading"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radar className="size-5 text-primary" aria-hidden="true" />
          Buscar notícias recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset>
          <legend className="text-sm font-medium">Selecione um tema</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {NEWS_RADAR_CATEGORIES.map((option) => (
              <button
                key={option.slug}
                type="button"
                aria-pressed={category === option.slug}
                disabled={status === "loading"}
                onClick={() => setCategory(option.slug)}
                className={`border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  category === option.slug
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="mt-1 block text-xs leading-5">{option.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <Button size="lg" onClick={() => void search()} disabled={status === "loading"}>
          {status === "loading" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
          {status === "loading" ? "Buscando notícias recentes..." : "Buscar notícias"}
        </Button>

        <div aria-live="polite" aria-atomic="true">
          {status === "loading" ? (
            <div className="border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground">
              Consultando as fontes de {NEWS_RADAR_CATEGORIES.find((item) => item.slug === category)?.label}. Isso pode levar alguns segundos.
            </div>
          ) : null}
          {status === "error" ? (
            <div role="alert" className="flex gap-3 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}
        </div>

        {status === "success" && result ? (
          <section aria-labelledby="radar-results-title" className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{result.categoryLabel}</p>
                <h2 id="radar-results-title" className="mt-1 text-2xl font-semibold">Notícias encontradas</h2>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {relativeUpdate(result.collectedAt)}
                {result.fromCache ? " • resultado recente reutilizado" : ""}
              </p>
            </div>

            {result.partial || result.stale ? (
              <div className="flex gap-3 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{result.stale
                  ? "As fontes não responderam agora. Exibimos a última coleta disponível, com o horário indicado acima."
                  : `Algumas fontes não responderam. A busca continuou com ${result.sourcesSucceeded} de ${result.sourcesChecked} fontes.`}</p>
              </div>
            ) : null}

            {!result.items.length ? (
              <div className="border border-border bg-muted/15 p-8 text-center">
                <h3 className="font-semibold">Nenhuma notícia recente encontrada</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Não incluímos conteúdo antigo apenas para completar a lista. Tente novamente mais tarde ou escolha outro tema.</p>
              </div>
            ) : null}

            {grouped.today.length ? (
              <div>
                <h3 className="text-base font-semibold">Publicadas hoje</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">{grouped.today.map((item) => <NewsCard key={item.url} item={item} category={result.category} />)}</div>
              </div>
            ) : null}
            {grouped.last24Hours.length ? (
              <div>
                <h3 className="text-base font-semibold">Também nas últimas 24 horas</h3>
                <p className="mt-1 text-xs text-muted-foreground">Separadas para não confundir publicações de ontem com as notícias de hoje.</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">{grouped.last24Hours.map((item) => <NewsCard key={item.url} item={item} category={result.category} />)}</div>
              </div>
            ) : null}
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
