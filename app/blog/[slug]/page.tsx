import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/blog/article-view";
import { getPublishedPostBySlug } from "@/lib/blog/repository";
import { SITE_URL, noIndexRobots } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPostBySlug((await params).slug);
  if (!post) return { title: "Matéria não encontrada", robots: noIndexRobots };
  const title = post.seoTitle || post.title; const description = post.metaDescription || post.excerpt;
  const canonical = post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`; const image = post.ogImage || post.cover?.url;
  return { title: { absolute: `${title.replace(/\s*\|\s*Kivai$/i, "")} | Kivai` }, description, alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { type: "article", locale: "pt_BR", siteName: "Kivai", url: canonical, title: post.ogTitle || title, description: post.ogDescription || description, publishedTime: post.originalPublishedAt ?? post.publishedAt ?? undefined, modifiedTime: post.updatedAt, authors: [post.author], images: image ? [{ url: image, alt: post.coverAlt || post.title }] : undefined }, twitter: { card: "summary_large_image", title: post.ogTitle || title, description: post.ogDescription || description, images: image ? [image] : undefined } };
}

export default async function ArticlePage({ params }: Props) {
  const post = await getPublishedPostBySlug((await params).slug); if (!post) notFound();
  const url = post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`;
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt, datePublished: post.originalPublishedAt ?? post.publishedAt ?? post.scheduledAt, dateModified: post.updatedAt, mainEntityOfPage: url, author: { "@type": "Person", name: post.author }, publisher: { "@type": "Organization", name: "Kivai", url: SITE_URL }, ...(post.cover ? { image: [post.ogImage || post.cover.url] } : {}) };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><ArticleView post={post} /></>;
}
