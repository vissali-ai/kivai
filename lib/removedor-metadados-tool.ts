import { getToolBySlug, getToolHref } from "@/lib/tools";

const tool = getToolBySlug("removedor-de-metadados")!;
export const removedorMetadadosTool = {
  ...tool,
  href: getToolHref(tool.slug),
  seoTitle: tool.seoTitle!,
  seoDescription: tool.seoDescription!,
  keywords: tool.keywords ?? [],
};
