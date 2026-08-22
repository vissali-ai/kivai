import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { getToolHref, tools } from "@/lib/tools";
import { listPublishedFeaturedTools } from "@/lib/site-cms/repository";

export async function FeaturedToolsSection() {
  const mostUsedTools = (await listPublishedFeaturedTools()).map((content) => {
    const tool = tools.find((item) => item.slug === content.slug);
    return { slug: content.slug, name: content.title, description: content.shortDescription, badge: tool?.badge ?? "Ferramenta", available: content.technicalStatus === "ready", icon: tool?.icon ?? Wrench };
  });
  return (
    <section className="border-t border-white/5 bg-background py-12 sm:py-14">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Mais usadas
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {mostUsedTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.slug}
                href={getToolHref(tool.slug)}
                className="group relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-4 ring-1 ring-primary/20 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-400/5" />

                <div className="relative flex h-full min-h-[190px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary transition duration-300 group-hover:scale-105">
                      <Icon className="size-4" />
                    </span>

                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {tool.available ? tool.badge : "Em breve"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold leading-5 tracking-tight text-foreground">
                    {tool.name}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {tool.description}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-foreground transition duration-300 group-hover:text-primary">
                    {tool.available ? "Explorar" : "Em breve"}
                    {tool.available && <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
