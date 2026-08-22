"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControls({ page, totalItems, pageSize = 10, onPageChange }: { page: number; totalItems: number; pageSize?: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  if (!totalItems) return null;
  return <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
    <p className="text-xs text-muted-foreground">Página {safePage} de {totalPages} · {totalItems} item(ns)</p>
    <div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}><ChevronLeft />Anterior</Button><Button type="button" variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>Próxima<ChevronRight /></Button></div>
  </nav>;
}
