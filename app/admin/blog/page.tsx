import Link from "next/link";
import { Bot, CalendarClock, FileText, Plus, Send, SquarePen } from "lucide-react";
import { PostActions } from "@/components/admin/post-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isBlogDatabaseConfigured } from "@/lib/blog/config";
import { listAllPosts, listCategories, listPosts, publishDueScheduledPosts } from "@/lib/blog/repository";
import type { PostStatus } from "@/lib/blog/types";

const statusLabels = { draft: "Rascunho", published: "Publicada", scheduled: "Agendada" };
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

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }> }) {
  const params = await searchParams;
  const status = (["draft", "published", "scheduled", "all"].includes(params.status ?? "") ? params.status : "draft") as PostStatus | "all";
  await publishDueScheduledPosts();
  const [allPosts, posts, categories] = await Promise.all([
    listAllPosts(), listPosts({ query: params.q, status, categoryId: params.category, page: Number(params.page || 1) }), listCategories(),
  ]);
  const stats = [
    { label: "Total de matérias", value: allPosts.length, icon: FileText },
    { label: "Publicadas", value: allPosts.filter((p) => p.status === "published").length, icon: Send },
    { label: "Rascunhos", value: allPosts.filter((p) => p.status === "draft").length, icon: SquarePen },
    { label: "Agendadas", value: allPosts.filter((p) => p.status === "scheduled").length, icon: CalendarClock },
    { label: "Aguardando revisão", value: allPosts.filter((p) => p.origin === "rss-agent" && p.reviewStatus === "awaiting-review").length, icon: Bot },
  ];
  const statusTabs: { label: string; value: PostStatus | "all"; count: number }[] = [
    { label: "Rascunhos", value: "draft", count: allPosts.filter((post) => post.status === "draft").length },
    { label: "Publicadas", value: "published", count: allPosts.filter((post) => post.status === "published").length },
    { label: "Agendadas", value: "scheduled", count: allPosts.filter((post) => post.status === "scheduled").length },
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between"><CardTitle>{label}</CardTitle><Icon className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
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
