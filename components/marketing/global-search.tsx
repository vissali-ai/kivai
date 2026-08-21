"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FileText, LayoutGrid, Loader2, Search, Wrench, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { archiveSearchItems } from "@/lib/archive-search-items";
import { plannedToolCategories } from "@/lib/planned-tool-categories";
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

const searchableCategories = [...toolCategories, ...plannedToolCategories];

const categoryNameBySlug = new Map(
  searchableCategories.map((category) => [category.slug, category.name])
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

const archiveToolItems: SearchItem[] = archiveSearchItems.map((tool) => ({
  id: `tool:${tool.slug}`,
  type: "tool",
  title: tool.name,
  description: tool.description,
  href: `/ferramentas/${tool.slug}`,
  category: "Arquivos",
  keywords: [tool.name, tool.description, "arquivos", ...tool.keywords],
}));

const hubItems: SearchItem[] = searchableCategories.map((category) => ({
  id: `hub:${category.slug}`,
  type: "hub",
  title: category.name,
  description: category.description,
  href: category.href,
  category: "Categoria de ferramentas",
  keywords: [category.name, category.description, category.slug],
}));

const staticItems = [...toolItems, ...archiveToolItems, ...hubItems];

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTrackedQuery = useRef("");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [articleItems, setArticleItems] = useState<SearchItem[]>([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo(() => [...staticItems, ...articleItems], [articleItems]);

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
      .slice(0, 10)
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
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setFocused(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

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
    if (event.key === "Escape") {
      setQuery("");
      setSelectedIndex(0);
      setFocused(false);
      inputRef.current?.blur();
      return;
    }

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
  }

  function trackClick(item: SearchItem) {
    trackEvent("search_result_click", {
      search_term: query.trim(),
      result_type: item.type,
      result_title: item.title,
    });
    setFocused(false);
  }

  const hasQuery = query.trim().length > 0;
  const showResults = focused && hasQuery;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 transition focus-within:border-primary/45 focus-within:bg-white/[0.055]">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          value={query}
          onFocus={() => {
            setFocused(true);
            loadArticles();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
            setFocused(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Busque uma ferramenta"
          aria-label="Buscar ferramentas e artigos do Kivai"
          aria-autocomplete="list"
          aria-controls="global-search-results"
          className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 sm:text-sm"
        />

        {articlesLoading ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Carregando artigos" />
        ) : null}

        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {showResults ? (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-[80] max-h-[70vh] w-[min(92vw,430px)] overflow-y-auto rounded-xl border border-white/10 bg-background/98 p-1.5 shadow-2xl shadow-black/35 backdrop-blur-xl"
        >
          {orderedResults.length ? (
            <div className="space-y-1">
              {orderedResults.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => trackClick(item)}
                  className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition ${
                    selectedIndex === index
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-white/[0.045]"
                  }`}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] text-primary">
                    <ResultIcon type={item.type} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                        {typeLabels[item.type]}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">Nenhum resultado encontrado.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
