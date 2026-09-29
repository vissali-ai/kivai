"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/blog/types";
import { buildCategoryNavigation } from "@/lib/blog/category-navigation";

const activeClass =
  "shrink-0 border border-primary/35 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary";

const inactiveClass =
  "shrink-0 border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground";

export function BlogCategoryNavigation({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const isAllActive = pathname === "/blog";

  return (
    <nav
      aria-label="Categorias do blog"
      className="sticky top-16 z-30 border-y border-white/[0.08] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
        <Link
          href="/blog"
          aria-current={isAllActive ? "page" : undefined}
          className={isAllActive ? activeClass : inactiveClass}
        >
          Todos
        </Link>

        {buildCategoryNavigation(categories).map((category) => {
          const href = `/blog/categoria/${category.slug}`;
          const isActive = pathname === href;

          return (
            <Link
              key={category.slug}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? activeClass : inactiveClass}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
