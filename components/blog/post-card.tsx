import Link from "next/link";
import Image from "next/image";
import { ToolGuideArtwork } from "@/components/blog/tool-guide-artwork";
import type { Post } from "@/lib/blog/types";

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
export function PostCard({ post }: { post: Post }) {
  const hasToolArtwork = post.category?.slug === "guia-de-ferramentas" && post.relatedToolSlugs.length > 0;
  return <article className="group overflow-hidden border border-white/10 bg-card"><Link href={`/blog/${post.slug}`} className="block">{post.cover || hasToolArtwork ? <div className="relative aspect-video overflow-hidden bg-white/[0.03]">{post.cover ? <Image src={post.cover.url} alt={post.coverAlt || post.cover.alt} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" /> : <ToolGuideArtwork post={post} />}</div> : null}<div className="p-5">{post.category ? <span className="text-xs font-semibold uppercase tracking-wider text-primary">{post.category.name}</span> : null}<h2 className="mt-2 text-xl font-semibold leading-snug group-hover:text-primary">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p><p className="mt-4 text-xs text-muted-foreground">{date.format(new Date(post.publishedAt ?? post.scheduledAt ?? post.createdAt))} · {post.author}</p></div></Link></article>;
}
