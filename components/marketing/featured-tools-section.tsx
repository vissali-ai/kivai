import { ToolCardLink } from "@/components/tools/tool-card-link";

import { ArrowRight, Wrench } from "lucide-react";
import { getToolHref, tools } from "@/lib/tools";
import { listPublishedFeaturedTools } from "@/lib/site-cms/repository";

export async function FeaturedToolsSection() {
  const mostUsedTools = (await listPublishedFeaturedTools()).map((content) => {
    const tool = tools.find((item) => item.slug === content.slug);
    return { slug: content.slug, name: content.title, description: content.shortDescription, badge: tool?.badge ?? "Ferramenta", available: content.technicalStatus === "ready", icon: tool?.icon ?? Wrench };
  });
  return (
    <section id="mais-usadas" className="bg-background py-9 sm:py-11">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Mais usadas
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mostUsedTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <ToolCardLink favoritePlacement="title" toolTitle={tool.name}
                key={tool.slug}
                href={getToolHref(tool.slug)}
                className="group relative min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/70"
              >
                <div className="relative flex h-full min-h-[152px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
                      <Icon className="size-4" />
                    </span>

                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {tool.available ? tool.badge : "Em breve"}
                    </span>
                  </div>

                  <h3 className="mt-3 pr-10 text-sm font-semibold leading-5 tracking-tight text-foreground">
                    {tool.name}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {tool.description}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium text-foreground transition duration-300 group-hover:text-primary">
                    {tool.available ? "Explorar" : "Em breve"}
                    {tool.available && <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />}
                  </div>
                </div>
              </ToolCardLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
