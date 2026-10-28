"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw, Search } from "lucide-react";
import type { TrendingTopic } from "@/lib/google-trends-rss";

type Props = { topics: TrendingTopic[]; fetchedAt: string | null; unavailable: boolean };
function trafficValue(value: string | null) {
  if (!value) return 0;
  const digit = Number(value.replace(/[^\d.,]/g, "").replace(/,/g, "."));
  if (!Number.isFinite(digit)) return 0;
  if (/mil|k/i.test(value)) return digit * 1000;
  if (/milh|million|m\+/i.test(value)) return digit * 1_000_000;
  return digit;
}
function formatDate(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
export function TrendsClient({ topics, fetchedAt, unavailable }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("feed");
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = useMemo(() => {
    const matches = topics.filter((topic) => topic.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR").trim()));
    if (sort === "recent") return [...matches].sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
    if (sort === "volume") return [...matches].sort((a, b) => trafficValue(b.volume) - trafficValue(a.volume));
    return matches;
  }, [topics, search, sort]);
  return (
    <section className="space-y-5" aria-label="Lista de tendências em alta">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Pesquisas em alta</h2>
          <p className="mt-1 text-sm text-muted-foreground">Brasil · {topics.length} {topics.length === 1 ? "tendência disponível" : "tendências disponíveis"} no feed</p>
          {fetchedAt && <p className="mt-1 text-xs text-muted-foreground">Consulta do servidor: {formatDate(fetchedAt)} (horário de Brasília). Cache de cerca de 10 minutos.</p>}
        </div>
        <a href="https://trends.google.com/trending?geo=BR" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Ver Google Trends <ArrowUpRight className="size-4" aria-hidden="true" /></a>
      </div>
      {unavailable ? (
        <div role="alert" className="rounded-lg border border-border bg-muted/30 p-5">
          <p className="font-semibold">Não foi possível carregar as tendências agora.</p>
          <p className="mt-2 text-sm text-muted-foreground">O feed do Google pode estar temporariamente indisponível. Tente recarregar esta página em alguns minutos.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><RefreshCw className="size-4" /> Tentar novamente</button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_210px]">
            <label className="relative block">
              <span className="sr-only">Buscar nas tendências disponíveis</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nas tendências disponíveis" className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Ordenar tendências</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm">
                <option value="feed">Ordem do Google</option>
                <option value="volume">Maior volume</option>
                <option value="recent">Mais recentes</option>
              </select>
            </label>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_165px_100px] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground md:grid">
              <span>Assunto</span><span>Volume aproximado</span><span>Início</span><span>Detalhes</span>
            </div>
            {visible.length ? visible.map((item) => (
              <article key={item.title} className="border-b border-border p-4 last:border-b-0">
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_165px_100px] md:items-center md:gap-3">
                  <h3 className="min-w-0 break-words text-sm font-semibold">{item.title}</h3>
                  <div className="text-sm"><span className="mr-2 text-xs text-muted-foreground md:hidden">Volume:</span>{item.volume ?? "Não informado"}</div>
                  <div className="text-xs text-muted-foreground"><span className="mr-2 md:hidden">Início:</span>{formatDate(item.publishedAt)}</div>
                  <button type="button" aria-expanded={expanded === item.title} onClick={() => setExpanded(expanded === item.title ? null : item.title)} className="w-fit rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">{expanded === item.title ? "Fechar" : "Detalhes"}</button>
                </div>
                {expanded === item.title && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <a href={item.exploreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Explorar no Google Trends <ArrowUpRight className="size-4" /></a>
                    <h4 className="text-sm font-medium">Notícias relacionadas</h4>
                    {item.news.length ? <ul className="space-y-2">{item.news.map((article) => <li key={article.url} className="text-sm"><a href={article.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{article.title} <ArrowUpRight className="inline size-3" /></a>{article.source && <span className="ml-2 text-xs text-muted-foreground">{article.source}</span>}</li>)}</ul> : <p className="text-sm text-muted-foreground">O feed não trouxe notícias para este assunto.</p>}
                  </div>
                )}
              </article>
            )) : <p className="p-6 text-sm text-muted-foreground">Nenhuma tendência disponível corresponde à pesquisa. A busca consulta somente os itens recebidos pelo RSS.</p>}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Volume aproximado e data de início fornecidos pelo Google Trends. Não são dados históricos nem métricas de redes sociais.</p>
        </>
      )}
    </section>
  );
}
