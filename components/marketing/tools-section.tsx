import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toolCategories } from "@/lib/tools";
import { plannedToolCategories } from "@/lib/planned-tool-categories";

const categories = [...toolCategories, ...plannedToolCategories];

// Cores suaves para identificar cada hub sem preencher os cards por completo.
const categoryAccents = Array.from({ length: 10 }, () => ({ color: "#FF5A36", soft: "#FFF0EC" }));

export function ToolsSection() {
  return (
    <section
      id="ferramentas"
      className="border-t border-border bg-background py-10 sm:py-12 lg:py-14"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Explorar categorias
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Encontre rapidamente a ferramenta ideal para cada necessidade.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category, index) => {
            const accent = categoryAccents[index % categoryAccents.length];

            return (
              <Link
                key={category.slug}
                href={category.href}
                style={{ borderLeftColor: accent.color }}
                className="group relative min-w-0 rounded-xl border border-l-[3px] border-border bg-card p-4 transition-colors duration-150 hover:border-primary/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex h-full min-h-[172px] flex-col">
                  <div className="flex justify-end">
                    <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Categoria
                    </span>
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold leading-5 tracking-tight text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {category.description}
                  </p>
                  <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium" style={{ color: "var(--cta-primary)" }}>
                    Explorar
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
