import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/lib/blog/types";

const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export function FeaturedPostCard({ post }: { post: Post }) {
  const publishedAt = post.publishedAt ?? post.scheduledAt ?? post.createdAt;
  return <article className="group overflow-hidden border border-white/10 bg-card transition hover:border-primary/35">
    <Link href={`/blog/${post.slug}`} className="grid h-full grid-cols-[112px_minmax(0,1fr)] sm:flex sm:flex-col">
      <div className="relative min-h-32 overflow-hidden bg-white/[0.03] sm:aspect-[16/9] sm:min-h-0">
        {post.cover ? <Image src={post.cover.url} alt={post.coverAlt || post.cover.alt} fill sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_58%)]" />}
        {post.category ? <span className="absolute left-2 top-2 hidden border border-primary/35 bg-background/85 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-primary backdrop-blur-md sm:block">{post.category.name}</span> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"><time dateTime={publishedAt}>{date.format(new Date(publishedAt))}</time>{post.category ? <span className="truncate text-primary sm:hidden">{post.category.name}</span> : null}</div>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-primary sm:text-base">{post.title}</h3>
        <p className="mt-2 hidden line-clamp-2 text-xs leading-5 text-muted-foreground sm:block">{post.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-semibold text-primary">Ler notícia <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
      </div>
    </Link>
  </article>;
}
