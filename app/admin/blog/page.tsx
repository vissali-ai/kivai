import Link from "next/link";
import { AlertTriangle, Archive, BarChart3, Bot, CalendarClock, Clock3, ExternalLink, FileText, MousePointerClick, Plus, Rss, Search, Send, SquarePen } from "lucide-react";
import { PostActions } from "@/components/admin/post-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isBlogDatabaseConfigured } from "@/lib/blog/config";
import { listAllPosts, listCategories, listPosts, publishDueScheduledPosts } from "@/lib/blog/repository";
import { listRadarMetrics } from "@/lib/news-radar/repository";
import { NEWS_RADAR_CATEGORIES } from "@/lib/news-radar/types";
import type { PostStatus } from "@/lib/blog/types";

const statusLabels: Record<PostStatus, string> = { draft: "Rascunho", published: "Publicada", scheduled: "Agendada", archived: "Arquivada" };
const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : date.format(parsed);
}

function formatPercentage(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }> }) {
  const params = await searchParams;
  const status = (["draft", "published", "scheduled", "archived", "all"].includes(params.status ?? "") ? params.status : "draft") as PostStatus | "all";
  await publishDueScheduledPosts();
  const [allPosts, posts, categories, radarResult] = await Promise.all([
    listAllPosts(),
    listPosts({ query: params.q, status, categoryId: params.category, page: Number(params.page || 1) }),
    listCategories(),
    listRadarMetrics(30).then((metrics) => ({ ready: true, metrics })).catch(() => ({ ready: false, metrics: [] })),
  ]);
  const radarTotals = radarResult.metrics.reduce((total, metric) => ({
    searches: total.searches + metric.searches,
    results: total.results + metric.resultsReturned,
    cacheHits: total.cacheHits + metric.cacheHits,
    errors: total.errors + metric.errors,
    clicks: total.clicks + metric.outboundClicks,
  }), { searches: 0, results: 0, cacheHits: 0, errors: 0, clicks: 0 });
  const radarByCategory = NEWS_RADAR_CATEGORIES.map((category) => {
    const categoryMetrics = radarResult.metrics.filter((metric) => metric.category === category.slug);
    return {
      ...category,
      searches: categoryMetrics.reduce((total, metric) => total + metric.searches, 0),
      clicks: categoryMetrics.reduce((total, metric) => total + metric.outboundClicks, 0),
      errors: categoryMetrics.reduce((total, metric) => total + metric.errors, 0),
    };
  });
  const stats = [
    { label: "Total de matérias", value: allPosts.length, icon: FileText },
    { label: "Publicadas", value: allPosts.filter((p) => p.status === "published").length, icon: Send },
    { label: "Rascunhos", value: allPosts.filter((p) => p.status === "draft").length, icon: SquarePen },
    { label: "Agendadas", value: allPosts.filter((p) => p.status === "scheduled").length, icon: CalendarClock },
    { label: "Arquivadas", value: allPosts.filter((p) => p.status === "archived").length, icon: Archive },
    { label: "Aguardando revisão", value: allPosts.filter((p) => p.origin === "rss-agent" && p.reviewStatus === "awaiting-review").length, icon: Bot },
  ];
  const statusTabs: { label: string; value: PostStatus | "all"; count: number }[] = [
    { label: "Rascunhos", value: "draft", count: allPosts.filter((post) => post.status === "draft").length },
    { label: "Publicadas", value: "published", count: allPosts.filter((post) => post.status === "published").length },
    { label: "Agendadas", value: "scheduled", count: allPosts.filter((post) => post.status === "scheduled").length },
    { label: "Arquivadas", value: "archived", count: allPosts.filter((post) => post.status === "archived").length },
    { label: "Todas", value: "all", count: allPosts.length },
  ];
  const statusHref = (nextStatus: PostStatus | "all") => {
    const query = new URLSearchParams({ status: nextStatus });
    if (params.q) query.set("q", params.q);
    if (params.category) query.set("category", params.category);
    return `/admin/blog?${query.toString()}`;
  };
  return <main>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Blog</p><h1 className="mt-1 text-3xl font-semibold">Painel editorial</h1><p className="mt-2 text-sm text-muted-foreground">Crie, revise e publique conteúdo no Kivai.</p></div><Button asChild className="h-9"><Link href="/admin/blog/nova"><Plus />Nova matéria</Link></Button></header>
    {!isBlogDatabaseConfigured() ? <div className="mb-6 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><strong>Configuração pendente.</strong> Aplique <code>supabase/migrations/001_blog_cms.sql</code> e configure as variáveis descritas em <code>.env.example</code>.</div> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between"><CardTitle>{label}</CardTitle><Icon className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader className="flex-row items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" />Radar público · últimos 30 dias</CardTitle><p className="mt-1 text-xs text-muted-foreground">Acompanhamento agregado do piloto, sem armazenar IP nas métricas.</p></div><Button asChild variant="outline" size="sm"><Link href="/ferramentas/radar-de-tendencias" target="_blank">Abrir Radar <ExternalLink /></Link></Button></CardHeader><CardContent>
      {!radarResult.ready ? <div className="mb-4 flex gap-3 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>Não foi possível carregar as métricas do Radar agora.</p></div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Buscas", value: radarTotals.searches, detail: "total no período", icon: Search },
          { label: "Resultados", value: radarTotals.results, detail: "notícias entregues", icon: Rss },
          { label: "Cliques", value: radarTotals.clicks, detail: `${formatPercentage(radarTotals.clicks, radarTotals.searches)} por busca`, icon: MousePointerClick },
          { label: "Taxa de sucesso", value: formatPercentage(Math.max(radarTotals.searches - radarTotals.errors, 0), radarTotals.searches), detail: `${radarTotals.errors} erro(s)`, icon: BarChart3 },
          { label: "Uso do cache", value: formatPercentage(radarTotals.cacheHits, radarTotals.searches), detail: `${radarTotals.cacheHits} busca(s)`, icon: Clock3 },
        ].map((item) => <div key={item.label} className="border border-border bg-muted/10 p-4"><item.icon className="size-4 text-primary" /><p className="mt-3 text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs font-medium">{item.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p></div>)}
      </div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="border-b border-white/10 text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Categoria</th><th className="px-3 py-2 font-medium">Buscas</th><th className="px-3 py-2 font-medium">Cliques</th><th className="px-3 py-2 font-medium">CTR por busca</th><th className="px-3 py-2 font-medium">Erros</th></tr></thead><tbody>{radarByCategory.map((category) => <tr key={category.slug} className="border-b border-white/5"><td className="px-3 py-3 font-medium">{category.label}</td><td className="px-3 py-3">{category.searches}</td><td className="px-3 py-3">{category.clicks}</td><td className="px-3 py-3">{formatPercentage(category.clicks, category.searches)}</td><td className="px-3 py-3">{category.errors}</td></tr>)}</tbody></table></div>
    </CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>Matérias</CardTitle></CardHeader><CardContent>
      <nav aria-label="Status das matérias" className="mb-4 flex gap-2 overflow-x-auto border-b border-white/10 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{statusTabs.map((tab) => <Link key={tab.value} href={statusHref(tab.value)} className={`shrink-0 border px-3 py-2 text-xs font-medium transition ${status === tab.value ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>{tab.label}<span className="ml-2 text-[10px] opacity-70">{tab.count}</span></Link>)}</nav>
      <form className="mb-4 grid gap-2 md:grid-cols-[1fr_220px_auto]"><input type="hidden" name="status" value={status} /><Input name="q" defaultValue={params.q} placeholder="Buscar por título" /><select name="category" defaultValue={params.category} className="h-8 border border-input bg-background px-2 text-xs"><option value="">Todas as categorias</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Button type="submit" variant="outline">Filtrar</Button></form>
      <div className="divide-y divide-white/5 md:hidden">{posts.map((post) => {
        const titleUrl = post.sourceUrl || (post.status === "published" ? `/blog/${post.slug}` : `/admin/blog/${post.id}/preview`);
        return <article key={post.id} className="py-3"><Link href={titleUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary hover:underline">{post.title}</Link><p className="mt-1 text-xs text-muted-foreground">{post.category?.name ?? "Sem categoria"}</p><div className="mt-1.5 flex min-h-8 items-center gap-2">{post.needsCover ? <p className="text-[11px] text-amber-300">Aguardando foto</p> : null}<PostActions id={post.id} slug={post.slug} status={post.status} mobileCompact /></div></article>;
      })}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-xs"><thead className="border-b border-white/10 text-muted-foreground"><tr>{["Título", "Categoria", "Status", "Criação", "Atualização", "Publicação", "Ações"].map((item) => <th key={item} className="px-3 py-3 font-medium">{item}</th>)}</tr></thead><tbody>{posts.map((post) => {
        const titleUrl = post.sourceUrl || (post.status === "published" ? `/blog/${post.slug}` : `/admin/blog/${post.id}/preview`);
        return <tr key={post.id} className="border-b border-white/5"><td className="max-w-xs px-3 py-3 font-medium"><div className="flex items-start gap-2"><Link href={titleUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{post.title}</Link>{post.origin === "rss-agent" ? <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">RSS</Badge> : null}</div>{post.needsCover ? <p className="mt-1 text-[11px] font-normal text-amber-300">Aguardando foto</p> : null}</td><td className="px-3 py-3">{post.category?.name ?? "Sem categoria"}</td><td className="px-3 py-3"><Badge variant="outline">{statusLabels[post.status]}</Badge></td><td className="px-3 py-3 text-muted-foreground">{formatDate(post.createdAt)}</td><td className="px-3 py-3 text-muted-foreground">{formatDate(post.updatedAt)}</td><td className="px-3 py-3 text-muted-foreground">{formatDate(post.publishedAt)}</td><td className="px-3 py-3"><PostActions id={post.id} slug={post.slug} status={post.status} /></td></tr>;
      })}</tbody></table></div>{!posts.length ? <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma matéria encontrada.</div> : null}
    </CardContent></Card>
  </main>;
}
