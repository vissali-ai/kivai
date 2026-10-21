import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewsAgentPanel({ canRun }: { canRun: boolean }) {
  return <Button size="sm" asChild={canRun} disabled={!canRun}>
    {canRun ? <Link href="/admin/blog/agente"><Search className="mr-2 size-4"/>Pesquisar com Gemini</Link>
      : <span><Search className="mr-2 size-4"/>Pesquisar com Gemini</span>}
  </Button>;
}
