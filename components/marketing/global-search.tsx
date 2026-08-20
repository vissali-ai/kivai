"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FileText, LayoutGrid, Loader2, Search, Wrench, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { toolCategories, tools } from "@/lib/tools";

type SearchItemType = "tool" | "hub" | "article";

type SearchItem = {
  id: string;
  type: SearchItemType;
  title: string;
  description: string;
  href: string;
  category: string;
  keywords: string[];
};

type SearchIndexResponse = {
  posts?: SearchItem[];
};

const categoryNameBySlug = new Map(
  toolCategories.map((category) => [category.slug, category.name])
);

const toolItems: SearchItem[] = tools
  .filter((tool) => tool.available)
  .map((tool) => ({
    id: `tool:${tool.slug}`,
    type: "tool",
    title: tool.name,
    description: tool.description,
    href: `/ferramentas/${tool.slug}`,
    category: categoryNameBySlug.get(tool.category) || tool.badge || "Ferramentas",
    keywords: [
      tool.name,
      tool.description,
      tool.seoTitle || "",
      tool.seoDescription || "",
      tool.badge,
      ...(tool.keywords || []),
    ].filter(Boolean),
  }));

const hubItems: SearchItem[] = toolCategories.map((category) => ({
  id: `hub:${category.slug}`,
  type: "hub",
  title: category.name,
  description: category.description,
  href: category.href,
  category: "Categoria de ferramentas",
  keywords: [category.name, category.description, category.slug],
}));

const staticItems = [...toolItems, ...hubItems];

const typeLabels: Record<SearchItemType, string> = {
  tool: "Ferramenta",
  hub: "Categoria",
  article: "Artigo",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItem(item: SearchItem, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return 0;

  const title = normalize(item.title);
  const description = normalize(item.description);
  const category = normalize(item.category);
  const keywords = item.keywords.map(normalize);
  const searchable = [title, description, category, ...keywords].join(" ");

  if (title === query) return 150;
  if (title.startsWith(query)) return 125;
  if (title.includes(query)) return 110;

  const queryTerms = query.split(" ").filter(Boolean);
  const titleMatches = queryTerms.filter((term) => title.includes(term)).length;
  const allMatches = queryTerms.filter((term) => searchable.includes(term)).length;

  if (queryTerms.length > 1 && titleMatches === queryTerms.length) return 105;
  if (queryTerms.length > 1 && allMatches === queryTerms.length) return 80;

  if (keywords.some((keyword) => keyword === query)) return 95;
  if (keywords.some((keyword) => keyword.startsWith(query))) return 85;
  if (keywords.some((keyword) => keyword.includes(query))) return 70;
  if (category.includes(query)) return 55;
  if (description.includes(query)) return 45;
  if (allMatches >= Math.ceil(queryTerms.length / 2)) return 35;

  return 0;
}

function ResultIcon({ type }: { type: SearchItemType }) {
  if (type === "tool") return <Wrench className="size-4" aria-hidden="true" />;
  if (type === "article") return <FileText className="size-4" aria-hidden="true" />;
  return <LayoutGrid className="size-4" aria-hidden="true" />;
}

function trackEvent(name: string, params: Record<string, string | number>) {
  if (typeof window === "undefined") return;

  const gtag = (
    window as Window & {
      gtag?: (...args: unknown[]) => void;
    }
  ).gtag;

  gtag?.("event", name, params);
}

export function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTrackedQuery = useRef("");
  const [query, setQuery] = useState("");
  const [articleItems, setArticleItems] = useState<SearchItem[]>([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo(
    () => [...staticItems, ...articleItems],
    [articleItems]
  );

  const results = useMemo(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    return allItems
      .map((item) => ({ item, score: scoreItem(item, cleanQuery) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.item.title.localeCompare(right.item.title, "pt-BR")
      )
      .slice(0, 12)
      .map((entry) => entry.item);
  }, [allItems, query]);

  const toolResults = results.filter((item) => item.type === "tool");
  const hubResults = results.filter((item) => item.type === "hub");
  const articleResults = results.filter((item) => item.type === "article");
  const orderedResults = [...toolResults, ...hubResults, ...articleResults];

  function loadArticles() {
    if (articlesLoaded || articlesLoading) return;

    setArticlesLoading(true);
    fetch("/api/search-index")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: SearchIndexResponse) => {
        setArticleItems(Array.isArray(data.posts) ? data.posts : []);
        setArticlesLoaded(true);
      })
      .catch(() => setArticlesLoaded(true))
      .finally(() => setArticlesLoading(false));
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2 || cleanQuery === lastTrackedQuery.current) return;

    const timeout = window.setTimeout(() => {
      lastTrackedQuery.current = cleanQuery;
      trackEvent("site_search", {
        search_term: cleanQuery,
        search_results: orderedResults.length,
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [query, orderedResults.length]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!orderedResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % orderedResults.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (current) => (current - 1 + orderedResults.length) % orderedResults.length
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = orderedResults[selectedIndex] || orderedResults[0];
      if (selected) window.location.href = selected.href;
    }

    if (event.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  }

  function trackClick(item: SearchItem) {
    trackEvent("search_result_click", {
      search_term: query.trim(),
      result_type: item.type,
      result_title: item.title,
    });
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div className="relative z-20 w-full max-w-4xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2 shadow-lg shadow-black/10 backdrop-blur-sm transition focus-within:border-primary/45 focus-within:bg-white/[0.05]">
        <div className="flex items-center gap-3 px-3">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={inputRef}
            value={query}
            onFocus={loadArticles}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Busque uma ferramenta, ex.: PDF para HTML"
            aria-label="Buscar ferramentas e conteúdos do Kivai"
            aria-autocomplete="list"
            aria-controls="tool-search-results"
            className="h-12 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 sm:text-base"
          />

          {articlesLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label="Carregando artigos" />
          ) : null}

          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {hasQuery ? (
        <div
          id="tool-search-results"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] max-h-[520px] overflow-y-auto rounded-2xl border border-white/10 bg-background/98 p-2 shadow-2xl shadow-black/35 backdrop-blur-xl"
        >
          {orderedResults.length ? (
            <div className="space-y-1">
              {orderedResults.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  id={`tool-search-result-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => trackClick(item)}
                  className={`group flex items-start gap-3 rounded-xl px-3 py-3 transition ${
                    selectedIndex === index
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-white/[0.045]"
                  }`}
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] text-primary">
                    <ResultIcon type={item.type} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {typeLabels[item.type]}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="font-medium text-foreground">Nenhum resultado encontrado.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tente outro termo, formato ou tarefa. Ex.: PDF, imagem, vídeo, Instagram ou porcentagem.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <p className="mt-3 text-sm text-muted-foreground">
        Pesquise pelo que você precisa fazer. O Kivai mostra a ferramenta mais próxima e conteúdos relacionados.
      </p>
    </div>
  );
}
