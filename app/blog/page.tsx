import type { Metadata } from "next";
import { PostList } from "@/components/blog/post-list";
import { filterIndexablePosts } from "@/lib/blog/indexing";
import { listPublishedPosts } from "@/lib/blog/repository";
import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({ title: "Blog", description: "Guias, análises e conteúdos originais sobre ferramentas digitais, tecnologia, inteligência artificial, marketing e negócios.", pathname: "/blog" });
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = filterIndexablePosts(await listPublishedPosts());
  return <main className="w-full flex-1"><header className="border-b border-white/10"><div className="mx-auto max-w-7xl px-4 pb-7 pt-10 sm:px-6 sm:pb-9 sm:pt-14 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Kivai editorial</p><h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Blog do Kivai</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Guias, análises e conteúdos originais para usar melhor ferramentas digitais, tecnologia e inteligência artificial.</p></div></header>
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16"><section aria-labelledby="latest-heading"><h2 id="latest-heading" className="text-2xl font-semibold sm:text-3xl">Guias e conteúdos</h2>{posts.length ? <PostList posts={posts} /> : <div className="mt-6 border border-white/10 bg-card p-6 sm:p-8"><h3 className="text-base font-semibold">Ainda não há conteúdos publicados.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Os próximos guias e conteúdos aparecerão aqui.</p></div>}</section></div>
  </main>;
}
