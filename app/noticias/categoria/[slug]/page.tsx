import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/post-card";
import { filterIndexablePosts } from "@/lib/blog/indexing";
import { listCategories, listPublishedPosts } from "@/lib/blog/repository";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "streaming.kivai.com.br") return { robots: { index: false, follow: false } };
  const slug = (await params).slug;
  const category = (await listCategories()).find((item) => item.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name} | Notícias do Streaming Kivai`,
    description: category.description || `Notícias sobre ${category.name} no Streaming Kivai.`,
    alternates: { canonical: `https://streaming.kivai.com.br/noticias/categoria/${category.slug}` },
  };
}

export default async function StreamingNewsCategory({ params }: Props) {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "streaming.kivai.com.br") notFound();
  const slug = (await params).slug;
  const [categories, posts] = await Promise.all([listCategories(), listPublishedPosts("kivai_streaming")]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const categoryPosts = filterIndexablePosts(posts).filter((post) => post.categoryId === category.id);
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Notícias · Categoria</p><h1 className="mt-2 text-4xl font-semibold">{category.name}</h1>{category.description ? <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p> : null}</header>
    {categoryPosts.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{categoryPosts.map((post) => <PostCard key={post.id} post={post} hrefPrefix="/noticias" />)}</div> : <p className="mt-10 border border-border p-8 text-sm text-muted-foreground">Esta categoria ainda não possui notícias publicadas.</p>}
  </main>;
}
