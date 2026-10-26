import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedSiteContentByPath } from "@/lib/site-cms/repository";
import { plansContent } from "@/lib/billing/plans-content";
import { withHomePlanFields } from "@/lib/billing/home-plan-content";

export async function ContextualPlanCallout({ location }: { location: "social-hub" | "social-tool" }) {
  // O conteúdo é administrado em /planos, sem segunda fonte de dados comercial.
  const stored = await getPublishedSiteContentByPath("/planos");
  const fields = withHomePlanFields((stored ?? plansContent).customData.originalFields);
  const value = (key: string) => fields.find(field => field.key === key)?.value;
  if (value("context-plans-enabled") === false || value("context-plans-enabled") === "false") return null;

  const title = String(value("context-plans-title") ?? "").trim() || "Conheça os planos Kivai";
  const text = String(value(location === "social-hub" ? "context-plans-hub-text" : "context-plans-tool-text") ?? "").trim();
  const cta = String(value("context-plans-cta") ?? "").trim() || "Comparar planos";

  return (
    <aside aria-label="Benefícios dos planos Kivai" className="rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {text ? <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p> : null}
        </div>
        <Link href="/planos" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:self-auto">
          {cta} <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </aside>
  );
}
