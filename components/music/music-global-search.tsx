"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Disc3, Loader2, Mic2, Music2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type MusicSearchItem = {
  id: string;
  type: "artist" | "album" | "track";
  title: string;
  description: string;
  href: string;
  artist: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreItem(item: MusicSearchItem, query: string) {
  const q = normalize(query);
  const title = normalize(item.title);
  const searchable = normalize([item.title, item.description, item.artist].join(" "));
  if (title === q) return 120;
  if (title.startsWith(q)) return 100;
  if (title.includes(q)) return 85;
  const terms = q.split(" ").filter(Boolean);
  const matches = terms.filter((term) => searchable.includes(term)).length;
  return matches === terms.length ? 65 : matches ? 25 : 0;
}

function ItemIcon({ type }: { type: MusicSearchItem["type"] }) {
  if (type === "artist") return <Mic2 className="size-4" aria-hidden="true" />;
  if (type === "album") return <Disc3 className="size-4" aria-hidden="true" />;
  return <Music2 className="size-4" aria-hidden="true" />;
}

const labels = { artist: "Artista", album: "Álbum", track: "Música" };

export function MusicGlobalSearch() {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState<MusicSearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return items.map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "pt-BR"))
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [items, query]);

  function loadCatalog() {
    if (loaded || loading) return;
    setLoading(true);
    fetch("/api/music/search")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { items?: MusicSearchItem[] }) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setQuery("");
      setSelectedIndex(0);
      setFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[selectedIndex] || results[0];
      if (selected) window.location.href = selected.href;
    }
  }

  const showResults = focused && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-card px-3 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 sm:h-10">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          value={query}
          onFocus={() => { setFocused(true); loadCatalog(); }}
          onChange={(event) => { setQuery(event.target.value); setSelectedIndex(0); setFocused(true); loadCatalog(); }}
          onKeyDown={onKeyDown}
          placeholder="Buscar artistas, álbuns e músicas"
          aria-label="Buscar artistas, álbuns e músicas"
          role="combobox"
          aria-expanded={showResults && results.length > 0}
          aria-autocomplete="list"
          aria-controls={showResults ? id : undefined}
          aria-activedescendant={showResults && results.length ? `${id}-option-${Math.min(selectedIndex, results.length - 1)}` : undefined}
          className="h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 sm:h-8 sm:text-sm"
        />
        {loading ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Carregando catálogo" /> : null}
        {query ? <button type="button" onClick={() => { setQuery(""); setSelectedIndex(0); inputRef.current?.focus(); }} className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Limpar busca"><X className="size-3.5" /></button> : null}
      </div>
      {showResults ? (
        <div id={id} role={results.length ? "listbox" : "status"} aria-label="Resultados da busca musical" className="absolute left-0 top-[calc(100%+8px)] z-[80] max-h-[65vh] w-full overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg shadow-black/10">
          {results.length ? <div className="space-y-1">
            {results.map((item, index) => <Link key={item.id} id={`${id}-option-${index}`} href={item.href} role="option" aria-selected={selectedIndex === index} onMouseEnter={() => setSelectedIndex(index)} onClick={() => setFocused(false)} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition ${selectedIndex === index ? "bg-primary/10 text-foreground" : "hover:bg-muted/70"}`}>
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary"><ItemIcon type={item.type} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-foreground">{item.title}</span><span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{labels[item.type]}</span></span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.artist}</span>
                {item.description ? <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{item.description}</span> : null}
              </span>
            </Link>)}
          </div> : <div className="px-4 py-6 text-center"><p className="text-sm font-medium text-foreground">Nenhum resultado encontrado.</p><p className="mt-1 text-xs text-muted-foreground">Tente buscar pelo nome do artista, álbum ou música.</p></div>}
        </div>
      ) : null}
    </div>
  );
}
