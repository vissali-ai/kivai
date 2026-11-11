import { notFound } from "next/navigation";
import { ToolAiContent } from "@/components/tools/tool-ai-content";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride } from "@/lib/site-cms/repository";
import { getExistingToolEditorialHtml } from "@/lib/site-cms/tool-editorial-source";
import { getToolBySlug } from "@/lib/tools";
import ResumeEditor from "./resume-editor";

const slug = "criador-de-curriculo-online";
export const generateMetadata = () => getToolMetadataAsync(slug);

export default async function Page() {
  const content = await getToolOverride(slug);
  if (content && content.status !== "published") notFound();
  const tool = getToolBySlug(slug)!;
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-20">
    <a href="/ferramentas/arquivos" className="text-sm underline">Hub Arquivos</a>
    <header><h1 className="font-heading text-4xl font-bold">{content?.title || tool.name}</h1>
      <p className="mt-3 text-muted-foreground">{content?.shortDescription || tool.description}</p></header>
    <ToolAiContent slug={slug}><ResumeEditor /></ToolAiContent>
    <article className="cms-public-content leading-7" dangerouslySetInnerHTML={{__html: content?.contentHtml ?? getExistingToolEditorialHtml(slug)}} />
  </main>;
}
