"use client";

import { ToolCardLink } from "@/components/tools/tool-card-link";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getToolHref, getToolsByCategory } from "@/lib/tools";

const filters = ["Todos", "Otimizar", "Converter", "Editar"];
const registeredTools = getToolsByCategory("imagens");
const tools = [
  ...registeredTools.map((tool) => ({
    ...tool,
    description:
      tool.slug === "redimensionar-imagem"
        ? "Redimensione imagens por pixels ou porcentagem e exporte em JPG, PNG ou WebP."
        : tool.description,
    href: getToolHref(tool.slug),
  })),
];

export default function ImagensPage() {
  const [filter, setFilter] = useState("Todos");
  const filteredTools =
    filter === "Todos" ? tools : tools.filter((tool) => tool.hubFilter === filter);

  return (
    <section className="bg-background pb-12 pt-24 sm:pb-14 lg:pb-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 border-l-2 border-sky-500/70 pl-4">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" />
            Voltar para o início
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Imagens</h1>
          <p className="mt-2 text-muted-foreground">Ferramentas para editar, converter, otimizar e preparar imagens para diferentes usos. Reduza arquivos, altere formatos e dimensões, remova fundos, recorte, gire, aplique marca d’água e utilize recursos para sites, e-commerce, redes sociais e projetos digitais.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${filter === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary hover:text-primary"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <ToolCardLink favoritePlacement="title" toolTitle={tool.name} key={tool.slug} href={tool.href} prefetch={false} className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/70">
                <div className="flex min-h-[152px] flex-col">
                  <div className="flex items-start justify-between"><span className="flex size-8 items-center justify-center text-sky-700"><Icon className="size-4" /></span><span className="rounded-full border border-border bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tool.badge}</span></div>
                  <h2 className="mt-3 pr-10 text-sm font-semibold leading-5">{tool.name}</h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{tool.description}</p>
                  <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium group-hover:text-primary">Explorar<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></div>
                </div>
              </ToolCardLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
