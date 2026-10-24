import { ToolCardLink } from "@/components/tools/tool-card-link";
import { HorizontalToolCarousel } from "@/components/marketing/horizontal-tool-carousel";
import { ArrowRight, Wrench } from "lucide-react";
import { getToolHref, tools } from "@/lib/tools";
import { listPublishedFeaturedTools } from "@/lib/site-cms/repository";

export async function FeaturedToolsSection() {
  const mostUsedTools = (await listPublishedFeaturedTools()).map((content) => {
    const tool = tools.find((item) => item.slug === content.slug);
    return {
      slug: content.slug,
      name: content.title,
      description: content.shortDescription,
      badge: tool?.badge ?? "Ferramenta",
      available: content.technicalStatus === "ready",
      icon: tool?.icon ?? Wrench,
    };
  });

  return (
    <section className="border-t border-[#D8DEE6] bg-[#ECEFF3] py-10 sm:py-12">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <HorizontalToolCarousel>
          {mostUsedTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <ToolCardLink
                toolTitle={tool.name}
                key={tool.slug}
                href={getToolHref(tool.slug)}
                className="group w-[min(78vw,272px)] shrink-0 snap-start rounded-xl border border-[#D8DEE6] bg-[#F9FAFC] p-4 transition-colors duration-150 hover:border-[#A8B1C3] hover:bg-white sm:w-[272px]"
              >
                <div className="flex h-full min-h-[154px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EBE9F7] text-[#5847AD]">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="shrink-0 rounded-full border border-[#DFE4EB] bg-[#F1F3F7] px-2 py-0.5 text-[10px] text-[#5C6878]">
                      {tool.available ? tool.badge : "Em breve"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold leading-5 tracking-tight text-[#202938]">
                    {tool.name}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#566375]">
                    {tool.description}
                  </p>

                  <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-[#5847AD]">
                    {tool.available ? "Explorar" : "Em breve"}
                    {tool.available && <ArrowRight aria-hidden="true" className="size-3.5" />}
                  </span>
                </div>
              </ToolCardLink>
            );
          })}
        </HorizontalToolCarousel>
      </div>
    </section>
  );
}
