import type { Metadata } from "next";
import { PostCard } from "@/components/blog/post-card";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { listFeaturedPosts, listPublishedPosts } from "@/lib/blog/repository";
import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({ title: "Blog", description: "Notícias, análises e conteúdos sobre tecnologia, inteligência artificial, marketing e negócios.", pathname: "/blog" });
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [posts, featuredPosts] = await Promise.all([listPublishedPosts(), listFeaturedPosts()]);
  const featuredIds = new Set(featuredPosts.map((post) => post.id));
  const remainingPosts = posts.filter((post) => !featuredIds.has(post.id));
  return <main className="w-full flex-1"><header className="border-b border-white/10"><div className="mx-auto max-w-7xl px-4 pb-7 pt-10 sm:px-6 sm:pb-9 sm:pt-14 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Kivai editorial</p><h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Blog do Kivai</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Notícias, análises e conteúdos revisados sobre tecnologia, inteligência artificial, marketing e negócios digitais.</p></div></header>
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16"><section aria-labelledby="featured-heading"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Seleção editorial</p><h2 id="featured-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">Notícias de Destaque</h2></div>{featuredPosts.length ? <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">{featuredPosts.map((post) => <FeaturedPostCard key={post.id} post={post} />)}</div> : <div className="border border-white/10 bg-card p-6 sm:p-8"><h3 className="text-base font-semibold">Os destaques aparecerão aqui após a primeira publicação.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">No painel administrativo, marque a matéria como destaque e escolha uma posição entre 1 e 12.</p></div>}</section>
      {remainingPosts.length ? <section aria-labelledby="latest-heading" className="mt-14 border-t border-white/10 pt-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Arquivo editorial</p><h2 id="latest-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">Mais notícias</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{remainingPosts.map((post) => <PostCard key={post.id} post={post} />)}</div></section> : null}
    </div>
  </main>;
}
