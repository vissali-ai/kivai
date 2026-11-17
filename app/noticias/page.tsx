import type { Metadata } from "next";
import { PostList } from "@/components/blog/post-list";
import { filterIndexablePosts } from "@/lib/blog/indexing";
import { listPublishedPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Notícias | Streaming Kivai",
  description: "Notícias, novidades e atualizações do universo da música e do entretenimento no Streaming Kivai.",
  alternates: { canonical: "https://streaming.kivai.com.br/noticias" },
};

export default async function StreamingNewsPage() {
  const posts = filterIndexablePosts(await listPublishedPosts("kivai_streaming"));
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
    <header className="border-b border-border pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Streaming Kivai</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Notícias</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Novidades, notícias e conteúdos editoriais publicados no Streaming Kivai.</p>
    </header>
    {posts.length ? <PostList posts={posts} hrefPrefix="/noticias" /> : <div className="mt-8 border border-border p-8"><h2 className="font-semibold">Em breve, novas notícias.</h2><p className="mt-2 text-sm text-muted-foreground">As publicações destinadas ao Streaming Kivai aparecerão nesta página.</p></div>}
  </main>;
}
