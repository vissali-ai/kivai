"use client";

import { Children, useState } from "react";
import { PaginationControls } from "@/components/admin/pagination-controls";

export function IncrementalList({ children, emptyMessage }: { children: React.ReactNode; emptyMessage: string }) {
  const items = Children.toArray(children);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (!items.length) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  return <>
    <div className="space-y-3">{items.slice((page - 1) * pageSize, page * pageSize)}</div>
    <PaginationControls page={page} totalItems={items.length} pageSize={pageSize} onPageChange={setPage} />
  </>;
}
