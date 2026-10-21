import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditorialResearchPanel } from "@/components/admin/editorial-research-panel";
import { listEditorialTopics } from "@/lib/news-agent/editorial-topics";

export const dynamic = "force-dynamic";

export default async function NewsAgentPage() {
  let topics = [] as Awaited<ReturnType<typeof listEditorialTopics>>;
  let configurationError = false;
  try { topics = await listEditorialTopics(); } catch { configurationError = true; }
  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Blog · Pesquisa editorial</p>
        <h1 className="mt-1 text-3xl font-semibold">Radar Editorial com Gemini</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pesquise notícias com referências e escolha pautas para os rascunhos do Kivai.</p></div>
      <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>Voltar ao blog</Link>
    </header>
    {configurationError ? <p className="border border-amber-500/40 p-4 text-sm text-amber-300">Temas indisponíveis. Aplique a migração blog_ai_research_topics no banco Kivai antes de pesquisar.</p> : <EditorialResearchPanel initialTopics={topics}/>}
  </main>;
}
