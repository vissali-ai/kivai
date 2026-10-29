import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * HTML nativo pré-renderizado: conteúdo e links permanecem no DOM mesmo
 * enquanto recolhidos. Nenhuma requisição adicional depende do clique.
 */
export function ToolSeoDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-base font-semibold marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-5 py-5 sm:px-6 [&_article]:border-0 [&_article]:bg-transparent [&_article]:p-0 [&_article]:shadow-none">
        {children}
      </div>
    </details>
  );
}
