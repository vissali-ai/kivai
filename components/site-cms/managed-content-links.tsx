import { ToolCardLink } from "@/components/tools/tool-card-link";
import { ArrowRight } from "lucide-react";
import { listPublishedContentsAt } from "@/lib/site-cms/repository";
import type { SiteContentType, SiteDisplayLocation } from "@/lib/site-cms/types";

export async function ManagedContentLinks({ location, title, contentType }: { location: SiteDisplayLocation; title: string; contentType?: SiteContentType }) {
  const items = await listPublishedContentsAt(location, contentType);
  if (!items.length) return null;

  // O mesmo tema claro cobre todos os blocos públicos de conteúdo.
  const lightHome = true;

  return (
    <section className={lightHome ? "border-t border-[#D8DEE6] bg-[#ECEFF3] py-12 text-[#202938]" : "border-t border-white/5 bg-background py-12"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ToolCardLink
              toolTitle={item.title}
              favoriteEnabled={item.contentType === "tool"}
              key={item.id}
              href={item.path}
              className={lightHome
                ? "group rounded-xl border border-[#D8DEE6] bg-[#F9FAFC] p-5 transition-colors hover:border-[#A8B1C3] hover:bg-white"
                : "group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/35"}
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className={lightHome ? "mt-2 line-clamp-3 text-sm leading-6 text-[#566375]" : "mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground"}>
                {item.shortDescription}
              </p>
              <span className={lightHome
                ? "mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#5847AD]"
                : "mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"}
              >
                Abrir
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </ToolCardLink>
          ))}
        </div>
      </div>
    </section>
  );
}
