"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  LayoutGrid,
  Loader2,
  Newspaper,
  Search,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toolCategories, tools } from "@/lib/tools";

type SearchItemType = "tool" | "hub" | "article" | "service";

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

const serviceItems: SearchItem[] = [
  {
    id: "service:social-media",
    type: "service",
    title: "Social Media",
    description:
      "Planejamento, criação e publicação de conteúdos para fortalecer a presença nas redes sociais.",
    href: "/servicos/social-media",
    category: "Serviços",
    keywords: ["redes sociais", "conteudo", "posts", "instagram", "social media"],
  },
  {
    id: "service:gestao-de-trafego",
    type: "service",
    title: "Gestão de Tráfego Pago",
    description:
      "Estratégias em Google Ads e Meta Ads para gerar oportunidades, vendas e crescimento.",
    href: "/servicos/gestao-de-trafego",
    category: "Serviços",
    keywords: ["google ads", "meta ads", "anuncios", "trafego pago", "campanhas"],
  },
  {
    id: "service:divulgacao-artistas",
    type: "service",
    title: "Divulgação para Artistas e Bandas",
    description:
      "Divulgação de lançamentos, shows e projetos musicais em diferentes redes sociais.",
    href: "/servicos/divulgacao-artistas",
    category: "Serviços",
    keywords: ["artistas", "bandas", "musica", "divulgacao", "lancamento musical"],
  },
  {
    id: "service:criacao-de-landing-pages",
    type: "service",
    title: "Criação de Landing Pages",
    description:
      "Páginas modernas e personalizadas para negócios, profissionais, eventos e projetos.",
    href: "/servicos/criacao-de-landing-pages",
    category: "Serviços",
    keywords: ["landing page", "pagina de vendas", "site", "conversao", "lp"],
  },
  {
    id: "service:automacao-de-processos",
    type: "service",
    title: "Automação de Processos",
    description:
      "Integração de ferramentas, tarefas, relatórios, notificações e fluxos operacionais.",
    href: "/servicos/automacao-de-processos",
    category: "Serviços",
    keywords: ["automacao", "make", "integracao", "processos", "fluxos"],
  },
  {
    id: "service:presenca-local-no-google",
    type: "service",
    title: "Presença Local no Google",
    description:
      "Criação e otimização do Perfil da Empresa no Google com acompanhamento.",
    href: "/servicos/presenca-local-no-google",
    category: "Serviços",
    keywords: ["google meu negocio", "perfil da empresa", "google maps", "negocio local"],
  },
  {
    id: "service:consultoria-ecommerce",
    type: "service",
    title: "Consultoria para E-commerce",
    description:
      "Análise de operação, catálogo, margem, conversão, marketplaces, estoque e indicadores.",
    href: "/servicos/consultoria-para-e-commerce",
    category: "Serviços",
    keywords: ["ecommerce", "loja virtual", "marketplace", "estoque", "margem"],
  },
  {
    id: "service:criacao-loja-virtual",
    type: "service",
    title: "Criação de Loja Virtual",
    description:
      "Implantação de e-commerce com catálogo, pagamentos, integrações e mensuração.",
    href: "/servicos/criacao-de-loja-virtual",
    category: "Serviços",
    keywords: ["ecommerce", "loja virtual", "site de vendas", "catalogo", "merchant center"],
  },
  {
    id: "service:seo-local",
    type: "service",
    title: "SEO Local",
    description:
      "Otimização para buscas locais com páginas, palavras-chave e acompanhamento de posições.",
    href: "/servicos/seo-local",
    category: "Serviços",
    keywords: ["seo", "google", "busca local", "posicionamento", "palavras chave"],
  },
  {
    id: "service:dashboards",
    type: "service",
    title: "Dashboards e Relatórios",
    description:
      "Indicadores personalizados para marketing, vendas, financeiro e operação.",
    href: "/servicos/dashboards-e-relatorios",
    category: "Serviços",
    keywords: ["dashboard", "relatorio", "dados", "indicadores", "metricas"],
  },
  {
    id: "service:sistemas-automacoes",
    type: "service",
    title: "Sistemas e Automações Personalizadas",
    description:
      "Ferramentas web para CRM, estoque, pedidos, leads, orçamentos e rotinas internas.",
    href: "/servicos/sistemas-e-automacoes-personalizadas",
    category: "Serviços",
    keywords: ["sistema", "automacao", "crm", "estoque", "software", "web app"],
  },
];

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
  category: "Hubs",
  keywords: [category.name, category.description, category.slug],
}));

const staticItems = [...toolItems, ...hubItems, ...serviceItems];
const suggestedItems = toolItems
  .filter((item) => {
    const tool = tools.find((candidate) => `tool:${candidate.slug}` === item.id);
    return tool?.featured;
  })
  .slice(0, 5);

const typeLabels: Record<SearchItemType, string> = {
  tool: "Ferramenta",
  hub: "Hub",
  article: "Artigo",
  service: "Serviço",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function scoreItem(item: SearchItem, query: string) {
  const title = normalize(item.title);
  const description = normalize(item.description);
  const category = normalize(item.category);
  const keywords = item.keywords.map(normalize);

  if (title === query) return 120;
  if (title.startsWith(query)) return 100;
  if (title.includes(query)) return 85;

  const exactKeyword = keywords.some((keyword) => keyword === query);
  if (exactKeyword) return 75;

  const keywordStarts = keywords.some((keyword) => keyword.startsWith(query));
  if (keywordStarts) return 65;

  const keywordIncludes = keywords.some((keyword) => keyword.includes(query));
  if (keywordIncludes) return 55;

  if (category.includes(query)) return 35;
  if (description.includes(query)) return 25;

  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    const searchable = [title, description, category, ...keywords].join(" ");
    const matches = terms.filter((term) => searchable.includes(term)).length;
    if (matches === terms.length) return 45;
    if (matches >= Math.ceil(terms.length / 2)) return 20;
  }

  return 0;
}

function ResultIcon({ type }: { type: SearchItemType }) {
  const Icon =
    type === "tool"
      ? Wrench
      : type === "hub"
        ? LayoutGrid
        : type === "article"
          ? Newspaper
          : BriefcaseBusiness;

  return <Icon className="size-4" aria-hidden="true" />;
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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTrackedQuery = useRef("");
  const [open, setOpen] = useState(false);
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
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    return allItems
      .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.item.title.localeCompare(right.item.title, "pt-BR")
      )
      .slice(0, 14)
      .map((entry) => entry.item);
  }, [allItems, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || articlesLoaded) return;

    const controller = new AbortController();
    setArticlesLoading(true);

    fetch("/api/search-index", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: SearchIndexResponse) => {
        setArticleItems(Array.isArray(data.posts) ? data.posts : []);
        setArticlesLoaded(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setArticlesLoaded(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setArticlesLoading(false);
      });

    return () => controller.abort();
  }, [open, articlesLoaded]);

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
        search_results: results.length,
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [query, results.length]);

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  function openItem(item: SearchItem) {
    trackEvent("search_result_click", {
      search_term: query.trim(),
      result_type: item.type,
      result_title: item.title,
    });

    closeSearch();
    router.push(item.href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + results.length) % results.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      openItem(results[selectedIndex] || results[0]);
    }
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-xl border-white/10 bg-white/[0.03]"
        aria-label="Pesquisar no Kivai"
        aria-keyshortcuts="Control+K Meta+K"
        title="Pesquisar no Kivai (Ctrl+K)"
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" aria-hidden="true" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-3 pt-[10vh] backdrop-blur-sm sm:px-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeSearch();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Pesquisa global do Kivai"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl shadow-black/40"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Buscar ferramentas, artigos e recursos..."
                aria-label="Buscar no site"
                aria-controls="global-search-results"
                aria-activedescendant={
                  hasQuery && results[selectedIndex]
                    ? `global-search-result-${selectedIndex}`
                    : undefined
                }
                className="h-11 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={closeSearch}
                aria-label="Fechar pesquisa"
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <div
              id="global-search-results"
              role={hasQuery ? "listbox" : undefined}
              aria-label={hasQuery ? "Resultados da pesquisa" : undefined}
              className="max-h-[65vh] overflow-y-auto p-2 sm:p-3"
            >
              {!hasQuery ? (
                <div className="p-2">
                  <div className="flex items-center justify-between gap-3 px-2 pb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Sugestões
                    </p>
                    {articlesLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        Atualizando artigos
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    {suggestedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openItem(item)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:outline-none"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <ResultIcon type={item.type} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        router.push("/ferramentas");
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                    >
                      Explorar todas as ferramentas
                    </button>
                  </div>
                </div>
              ) : results.length ? (
                <div className="space-y-1">
                  {results.map((item, index) => (
                    <button
                      id={`global-search-result-${index}`}
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selectedIndex === index}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => openItem(item)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none ${
                        selectedIndex === index
                          ? "bg-white/[0.06]"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-muted-foreground">
                        <ResultIcon type={item.type} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-foreground">
                            {item.title}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {typeLabels[item.type]}
                          </span>
                        </span>
                        <span className="mt-1 line-clamp-1 block text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">
                          {item.category}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <Search className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" />
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Nenhum resultado encontrado.
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Tente outro termo ou explore os hubs de ferramentas do Kivai.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 rounded-xl border-white/10 bg-white/[0.03]"
                    onClick={() => {
                      closeSearch();
                      router.push("/ferramentas");
                    }}
                  >
                    Explorar ferramentas
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden items-center justify-between border-t border-white/10 px-5 py-2.5 text-[11px] text-muted-foreground sm:flex">
              <span>Use ↑ ↓ para navegar e Enter para abrir</span>
              <span>Esc para fechar</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
