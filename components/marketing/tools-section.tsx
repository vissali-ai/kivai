import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toolCategories } from "@/lib/tools";
import { plannedToolCategories } from "@/lib/planned-tool-categories";
import { getToolCategoryAccentClass } from "@/lib/tool-category-visuals";

const categories = [...toolCategories, ...plannedToolCategories];

export function ToolsSection() {
  return (
    <section
      id="ferramentas"
      className="relative border-t border-border bg-background py-9 sm:py-11 lg:py-12"
    >
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Explorar categorias
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Encontre rapidamente a ferramenta ideal para cada necessidade.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            const cardClassName = [
              "group relative min-w-0 overflow-hidden rounded-lg border border-l-2 p-4 transition-colors",
              "border-border bg-card",
              "hover:border-primary/40 hover:bg-secondary/70",
              getToolCategoryAccentClass(category.slug),
            ].join(" ");

            const cardContent = (
              <>
                <div className="relative flex h-full min-h-[152px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
                      <Icon className="size-4" />
                    </span>

                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                      Categoria
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold leading-5 tracking-tight text-foreground">
                    {category.name}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {category.description}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium text-foreground transition duration-300 group-hover:text-primary">
                    Explorar
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </>
            );

            return (
              <Link key={category.slug} href={category.href} className={cardClassName}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
