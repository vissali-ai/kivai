import Link from "next/link";
import { Bot, CalendarClock, FileText, Plus, Send, SquarePen } from "lucide-react";
import { PostActions } from "@/components/admin/post-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isBlogDatabaseConfigured } from "@/lib/blog/config";
import { listAllPosts, listCategories, listPosts } from "@/lib/blog/repository";
import type { PostStatus } from "@/lib/blog/types";

const statusLabels = { draft: "Rascunho", published: "Publicada", scheduled: "Agendada" };
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }> }) {
  const params = await searchParams;
  const status = (["draft", "published", "scheduled"].includes(params.status ?? "") ? params.status : "all") as PostStatus | "all";
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
  return <main>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Blog</p><h1 className="mt-1 text-3xl font-semibold">Painel editorial</h1><p className="mt-2 text-sm text-muted-foreground">Crie, revise e publique conteúdo no Kivai.</p></div><Button asChild className="h-9"><Link href="/admin/blog/nova"><Plus />Nova matéria</Link></Button></header>
    {!isBlogDatabaseConfigured() ? <div className="mb-6 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><strong>Configuração pendente.</strong> Aplique <code>supabase/migrations/001_blog_cms.sql</code> e configure as variáveis descritas em <code>.env.example</code>.</div> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="flex-row items-center justify-between"><CardTitle>{label}</CardTitle><Icon className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>Matérias</CardTitle></CardHeader><CardContent>
      <form className="mb-4 grid gap-2 md:grid-cols-[1fr_180px_220px_auto]"><Input name="q" defaultValue={params.q} placeholder="Buscar por título" /><select name="status" defaultValue={status} className="h-8 border border-input bg-background px-2 text-xs"><option value="all">Todas</option><option value="published">Publicadas</option><option value="draft">Rascunhos</option><option value="scheduled">Agendadas</option></select><select name="category" defaultValue={params.category} className="h-8 border border-input bg-background px-2 text-xs"><option value="">Todas as categorias</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Button type="submit" variant="outline">Filtrar</Button></form>
      <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-xs"><thead className="border-b border-white/10 text-muted-foreground"><tr>{["Título", "Categoria", "Autor", "Status", "Criação", "Atualização", "Publicação", "Ações"].map((item) => <th key={item} className="px-3 py-3 font-medium">{item}</th>)}</tr></thead><tbody>{posts.map((post) => <tr key={post.id} className="border-b border-white/5"><td className="max-w-xs px-3 py-3 font-medium"><div className="flex items-start gap-2"><span>{post.title}</span>{post.origin === "rss-agent" ? <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">IA</Badge> : null}</div>{post.needsCover ? <p className="mt-1 text-[11px] font-normal text-amber-300">Aguardando foto</p> : null}</td><td className="px-3 py-3">{post.category?.name ?? "Sem categoria"}</td><td className="px-3 py-3">{post.author}</td><td className="px-3 py-3"><Badge variant="outline">{statusLabels[post.status]}</Badge></td><td className="px-3 py-3 text-muted-foreground">{date.format(new Date(post.createdAt))}</td><td className="px-3 py-3 text-muted-foreground">{date.format(new Date(post.updatedAt))}</td><td className="px-3 py-3 text-muted-foreground">{post.publishedAt ? date.format(new Date(post.publishedAt)) : "-"}</td><td className="px-3 py-3"><PostActions id={post.id} slug={post.slug} status={post.status} /></td></tr>)}</tbody></table>{!posts.length ? <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma matéria encontrada.</div> : null}</div>
    </CardContent></Card>
  </main>;
}
