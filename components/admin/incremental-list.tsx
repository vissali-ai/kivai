"use client";

import { Children, useState } from "react";
import { Button } from "@/components/ui/button";

export function IncrementalList({ children, emptyMessage }: { children: React.ReactNode; emptyMessage: string }) {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(10);

  if (!items.length) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  return <>
    <div className="space-y-3">{items.slice(0, visibleCount)}</div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">Exibindo {Math.min(visibleCount, items.length)} de {items.length}</p>
      {visibleCount < items.length ? <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 10)}>Carregar mais</Button> : null}
    </div>
  </>;
}
