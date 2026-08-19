import { Sparkles } from "lucide-react";
import { getToolBySlug } from "@/lib/tools";
import type { Post } from "@/lib/blog/types";

export function ToolGuideArtwork({ post }: { post: Post }) {
  const toolSlug = post.relatedToolSlugs[0];
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;

  if (!tool || post.category?.slug !== "guia-de-ferramentas") {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_58%)]" />
    );
  }

  const Icon = tool.icon;

  return (
    <div
      aria-hidden="true"
      data-tool-guide-artwork={tool.slug}
      className="absolute inset-0 isolate overflow-hidden bg-[linear-gradient(145deg,rgba(99,102,241,0.16),rgba(9,11,19,0.98)_56%,rgba(34,211,238,0.08))]"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom_right,black,transparent_80%)]" />
      <div className="absolute -right-10 -top-12 -z-10 size-40 rounded-full bg-primary/25 blur-3xl transition duration-500 group-hover:bg-primary/35" />

      <div className="flex h-full items-center justify-center p-3 sm:flex-col sm:gap-3 sm:p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-[0_0_32px_rgba(99,102,241,0.18)] transition duration-300 group-hover:scale-105 sm:size-16">
          <Icon className="size-7 sm:size-8" strokeWidth={1.65} />
        </span>

        <div className="ml-3 min-w-0 sm:ml-0 sm:text-center">
          <span className="hidden items-center justify-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/90 sm:flex">
            <Sparkles className="size-3" />
            Ferramenta Kivai
          </span>
          <p className="mt-1 hidden max-w-52 text-balance text-sm font-semibold leading-snug text-foreground/90 sm:line-clamp-2 sm:block">
            {tool.name}
          </p>
        </div>
      </div>
    </div>
  );
}
