import Link from "next/link";
import type { Category } from "@/lib/blog/types";
import { buildCategoryNavigation } from "@/lib/blog/category-navigation";

export function BlogCategoryNavigation({ categories }: { categories: Category[] }) {
  return <nav aria-label="Categorias do blog" className="sticky top-16 z-30 border-y border-white/[0.08] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
    <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
      <Link href="/blog" className="shrink-0 border border-primary/35 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">Todos</Link>
      {buildCategoryNavigation(categories).map((category) => <Link key={category.slug} href={`/blog/categoria/${category.slug}`} className="shrink-0 border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">{category.name}</Link>)}
    </div>
  </nav>;
}
