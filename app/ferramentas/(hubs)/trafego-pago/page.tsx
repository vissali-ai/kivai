"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
import { ToolCardLink } from "@/components/tools/tool-card-link";
import { getToolHref, getToolsByCategory } from "@/lib/tools";

const filters = ["Todos", "Gestão"] as const;
type Filter = (typeof filters)[number];

const tools = getToolsByCategory("trafego");

export default function TrafegoPagoHub() {
  const [filter, setFilter] = useState<Filter>("Todos");
  const filteredTools = filter === "Todos"
    ? tools
    : tools.filter((tool) => tool.hubFilter === filter);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-background pb-12 pt-24 sm:pb-14 lg:pb-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar para o início
            </Link>
          </div>

          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Planejamento e análise de campanhas
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Tráfego Pago
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Planeje metas de mídia paga, acompanhe o investimento e analise o desempenho
              das campanhas Google Ads para identificar pontos de atenção e oportunidades de melhoria.
            </p>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar ferramentas de tráfego pago">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    filter === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const content = (
                <div className="flex min-h-[152px] flex-col">
                  <div className="flex items-start justify-between">
                    <span className="flex size-8 items-center justify-center text-indigo-700">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-border bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {tool.available ? tool.badge : "Em breve"}
                    </span>
                  </div>
                  <h2 className="mt-3 pr-10 text-sm font-semibold leading-5">{tool.name}</h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{tool.description}</p>
                  <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium group-hover:text-primary">
                    {tool.available ? "Explorar" : "Em breve"}
                    {tool.available ? (
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    ) : null}
                  </div>
                </div>
              );

              return tool.available ? (
                <ToolCardLink favoritePlacement="title"
                  toolTitle={tool.name}
                  key={tool.slug}
                  href={getToolHref(tool.slug)}
                  prefetch={false}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/70"
                >
                  {content}
                </ToolCardLink>
              ) : (
                <article
                  key={tool.slug}
                  className="relative overflow-hidden rounded-lg border border-border bg-card p-4 opacity-75"
                >
                  {content}
                </article>
              );
            })}
          </div>

          <div className="mt-8">
            <AdSlot placement="page-footer" />
          </div>
        </div>
      </section>
    </main>
  );
}
