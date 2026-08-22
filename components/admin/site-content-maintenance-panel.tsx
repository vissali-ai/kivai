"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PanelsTopLeft } from "lucide-react";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSiteEditDate } from "@/lib/site-cms/date";

export type SiteAttentionCategory = "technical" | "editorial" | "seo" | "hub";
export type SiteMaintenanceItem = {
  id: string;
  title: string;
  path: string;
  kind: "content" | "hub" | "service";
  editHref: string;
  updatedAt: string;
  findings: Array<{ category: SiteAttentionCategory; label: string }>;
};

const PAGE_SIZE = 10;
const filters: Array<{ value: "all" | SiteAttentionCategory; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "technical", label: "Implementação" },
  { value: "editorial", label: "Editorial" },
  { value: "seo", label: "SEO" },
  { value: "hub", label: "Hubs" },
];

export function SiteContentMaintenancePanel({ items }: { items: SiteMaintenanceItem[] }) {
  const [filter, setFilter] = useState<"all" | SiteAttentionCategory>("all");
  const [page, setPage] = useState(1);
  const counts = useMemo(() => new Map(filters.map(({ value }) => [value, value === "all" ? items.length : items.filter((item) => item.findings.some((finding) => finding.category === value)).length])), [items]);
  const filteredItems = useMemo(() => filter === "all" ? items : items.filter((item) => item.findings.some((finding) => finding.category === filter)), [filter, items]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)));
  const visibleItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return <Card id="conteudo-site" className="mt-6 scroll-mt-24"><CardHeader><CardTitle className="flex items-center gap-2"><PanelsTopLeft className="size-4 text-primary" />Manutenção do conteúdo do site</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Aqui estão os conteúdos que merecem atenção e o motivo exato. A auditoria não altera nada automaticamente.</p>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{filters.map(({ value, label }) => <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => { setFilter(value); setPage(1); }}>{label} ({counts.get(value) ?? 0})</Button>)}</div>
    {visibleItems.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{visibleItems.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-black/10 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{item.kind === "hub" ? `Hub: ${item.title}` : item.title}</h3><p className="mt-1 break-all text-[11px] text-muted-foreground">{item.path}</p></div>{item.findings.some((finding) => finding.category === "technical") ? <Badge variant="outline" className="border-amber-500/30 text-amber-300">Implementar</Badge> : null}</div><p className="mt-3 text-xs text-muted-foreground"><strong>Última edição:</strong> {formatSiteEditDate(item.updatedAt)}</p><ul className="mt-3 space-y-1 text-xs text-amber-200">{item.findings.map((finding) => <li key={`${finding.category}:${finding.label}`}>• {finding.label}</li>)}</ul><Button asChild variant="outline" size="sm" className="mt-4 self-start"><Link href={item.editHref}>Abrir para corrigir</Link></Button></article>)}</div> : <p className="mt-4 rounded-md border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-emerald-200">Nenhum item nesta categoria precisa de atenção.</p>}
    <PaginationControls page={safePage} totalItems={filteredItems.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </CardContent></Card>;
}
