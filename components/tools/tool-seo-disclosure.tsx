import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * HTML nativo pré-renderizado: conteúdo e links permanecem no DOM mesmo
 * enquanto recolhidos. Nenhuma requisição adicional depende do clique.
 */
export function ToolSeoDisclosure({ title, children }: { title: string; children: ReactNode }) {
  if (title === "Ferramentas e conteúdos relacionados") {
    return (
      <section aria-label={title} className="rounded-lg border border-border/70 bg-card/60 px-4 py-4 sm:px-5">
        
        <div className="[&_nav]:border-0 [&_nav]:bg-transparent [&_nav]:p-0 [&_nav]:shadow-none [&_nav_h2]:text-sm [&_nav_h2]:font-medium [&_nav_h2]:text-muted-foreground [&_nav_a]:text-sm">
          {children}
        </div>
      </section>
    );
  }

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
