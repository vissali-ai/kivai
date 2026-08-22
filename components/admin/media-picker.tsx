"use client";

import { useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/admin/pagination-controls";
import type { Media } from "@/lib/blog/types";

export function MediaPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (media: Media) => void }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    if (!open) return;
    fetch(`/api/admin/media?q=${encodeURIComponent(query)}`).then((response) => response.json()).then((data) => setMedia(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, [open, query]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Selecionar mídia"><div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-white/10 bg-background p-3 shadow-2xl sm:p-5"><header className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Biblioteca de mídia</h2><p className="text-xs text-muted-foreground">Selecione uma imagem existente.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></header><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setLoading(true); }} placeholder="Pesquisar arquivo" className="mb-4" />{loading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p> : <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{media.slice((page - 1) * pageSize, page * pageSize).map((item) => <button type="button" key={item.id} className="min-w-0 border border-white/10 bg-card p-2 text-left transition hover:border-primary" onClick={() => { onSelect(item); onClose(); }}><div className="aspect-video overflow-hidden bg-white/5"><img src={item.url} alt={item.alt || ""} className="h-full w-full object-cover" /></div><p className="mt-2 truncate text-xs font-medium">{item.filename}</p><p className="truncate text-[11px] text-muted-foreground">{item.alt || "Sem texto alternativo"}</p></button>)}</div>}{!loading ? <PaginationControls page={page} totalItems={media.length} pageSize={pageSize} onPageChange={setPage} /> : null}{!loading && !media.length ? <div className="py-10 text-center text-sm text-muted-foreground"><ImageIcon className="mx-auto mb-2" />Nenhuma imagem encontrada. Envie uma em Mídias.</div> : null}</div></div>;
}
