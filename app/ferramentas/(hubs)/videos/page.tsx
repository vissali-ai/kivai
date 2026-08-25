"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
import { getToolHref, getToolsByCategory } from "@/lib/tools";

const filters = ["Todos", "Baixar", "Edição", "Converter", "Otimizar"];
const tools = getToolsByCategory("video");

export default function VideosPage() {
  const [filter, setFilter] = useState("Todos");
  const filteredTools = filter === "Todos" ? tools : tools.filter((tool) => tool.hubFilter === filter);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-background pb-12 pt-24 sm:pb-14 lg:pb-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar para o início
            </Link>
          </div>

          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramentas de vídeo</p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Vídeos</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Baixe mídias públicas autorizadas, converta, edite e otimize vídeos com ferramentas online para tarefas rápidas.
            </p>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar ferramentas de vídeo">
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

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const content = (
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {tool.available ? tool.badge : "Em breve"}
                    </span>
                  </div>
                  <h2 className="mt-4 text-[15px] font-semibold">{tool.name}</h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{tool.description}</p>
                  <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium group-hover:text-primary">
                    {tool.available ? "Explorar" : "Em breve"}
                    {tool.available ? (
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    ) : null}
                  </div>
                </div>
              );

              return tool.available ? (
                <Link
                  key={tool.slug}
                  href={getToolHref(tool.slug)}
                  className="group relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055] sm:aspect-square sm:p-4"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={tool.slug}
                  className="relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 opacity-75 sm:aspect-square sm:p-4"
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
