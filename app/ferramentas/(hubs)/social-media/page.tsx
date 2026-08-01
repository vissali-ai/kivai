"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getToolHref, getToolsByCategory } from "@/lib/tools";

const tools = getToolsByCategory("social");

export default function SocialMediaPage() {
  return <section className="relative overflow-hidden bg-background pb-12 pt-24 sm:pb-14 lg:pb-16"><div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8"><div className="mb-8"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4"/>Voltar para o início</Link><h1 className="text-3xl font-semibold tracking-tight text-foreground">Social Media</h1><p className="mt-2 max-w-2xl text-muted-foreground">Crie, revise e otimize conteúdos para redes sociais diretamente no navegador.</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{tools.map((tool) => { const Icon = tool.icon; return <Link key={tool.slug} href={getToolHref(tool.slug)} className="group relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055] sm:aspect-square sm:p-4"><div className="flex h-full flex-col"><div className="flex items-start justify-between"><span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"><Icon className="size-4"/></span><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">{tool.badge}</span></div><h2 className="mt-4 text-[15px] font-semibold">{tool.name}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{tool.description}</p><div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium group-hover:text-primary">Explorar<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1"/></div></div></Link>; })}</div></div></section>;
}
