import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toolCategories } from "@/lib/tools";
import { plannedToolCategories } from "@/lib/planned-tool-categories";

const categories = [...toolCategories, ...plannedToolCategories];

// Cores suaves para identificar cada hub sem preencher os cards por completo.
const categoryAccents = [
  { color: "#585EAF", soft: "#EEEFFC" },
  { color: "#AF5A64", soft: "#FBEFF0" },
  { color: "#157C82", soft: "#E9F5F5" },
  { color: "#95632B", soft: "#FBF2E6" },
  { color: "#8060A8", soft: "#F4EFFA" },
  { color: "#356EAB", soft: "#ECF3FB" },
  { color: "#308360", soft: "#EAF5EE" },
  { color: "#AB6748", soft: "#FAEFE9" },
  { color: "#6A60A5", soft: "#F0EFF9" },
  { color: "#447B83", soft: "#EDF6F6" },
] as const;

export function ToolsSection() {
  return (
    <section
      id="ferramentas"
      className="border-t border-[#D8DEE6] bg-[#ECEFF3] py-10 sm:py-12 lg:py-14"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-[#202938]">
            Explorar categorias
          </h2>
          <p className="mt-2 text-sm text-[#566375]">
            Encontre rapidamente a ferramenta ideal para cada necessidade.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const accent = categoryAccents[index % categoryAccents.length];

            return (
              <Link
                key={category.slug}
                href={category.href}
                style={{ borderLeftColor: accent.color }}
                className="group relative min-w-0 rounded-xl border border-l-[3px] border-[#DAE0E8] bg-[#F9FAFC] p-4 transition-colors duration-150 hover:border-[#ADB7C7] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5847AD]"
              >
                <div className="flex h-full min-h-[172px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: accent.soft, color: accent.color }}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="shrink-0 rounded-full border border-[#E0E5EC] bg-[#F1F3F7] px-2 py-0.5 text-[10px] text-[#647081]">
                      Categoria
                    </span>
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold leading-5 tracking-tight text-[#202938]">
                    {category.name}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#566375]">
                    {category.description}
                  </p>
                  <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium" style={{ color: accent.color }}>
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
