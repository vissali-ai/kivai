import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/blog/types";

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
export function PostCard({ post }: { post: Post }) {
  return <article className="group overflow-hidden border border-white/10 bg-card"><Link href={`/blog/${post.slug}`} className="block">{post.cover ? <Image src={post.cover.url} alt={post.coverAlt || post.cover.alt} width={post.cover.width} height={post.cover.height} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : null}<div className="p-5">{post.category ? <span className="text-xs font-semibold uppercase tracking-wider text-primary">{post.category.name}</span> : null}<h2 className="mt-2 text-xl font-semibold leading-snug group-hover:text-primary">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p><p className="mt-4 text-xs text-muted-foreground">{date.format(new Date(post.publishedAt ?? post.scheduledAt ?? post.createdAt))} · {post.author}</p></div></Link></article>;
}
