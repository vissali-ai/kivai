import { notFound } from "next/navigation";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { ToolAiProvider } from "@/components/tools/tool-ai-provider";
import { assistantCopy } from "@/lib/ai/content-assistant-copy";
import { businessIdeasEditorial as editorial, businessIdeasSlug as slug } from "@/lib/business-ideas-editorial";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride } from "@/lib/site-cms/repository";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";
import Questionnaire from "./questionnaire";

export const generateMetadata = () => getToolMetadataAsync(slug);
export default async function Page() {
  const content = await getToolOverride(slug);
  if (content && content.status !== "published") notFound();
  const tool = getToolBySlug(slug)!;
  const name = content?.title || tool.name;
  const description = content?.shortDescription || tool.description;
  const schema = buildToolPageSchema({slug,name,description,applicationCategory:"BusinessApplication",
    breadcrumbs:[{name:"Início",href:"/"},{name:"Ferramentas",href:"/ferramentas"},{name:"Empresas",href:"/ferramentas/empresas"},{name,href:"/ferramentas/"+slug}],
    faqs:content?.contentHtml ? [] : editorial.faqs});
  // Credit packages vary; omit the shared builder's free offer for this paid generation.
  for (const item of schema["@graph"]) if (item["@type"] === "SoftwareApplication") delete item.offers;
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
    <div className="mx-auto max-w-5xl space-y-7 px-4 py-16 sm:px-6">
      <a className="text-sm underline" href="/ferramentas/empresas">Hub Empresas</a>
      <header><h1 className="font-heading text-4xl font-bold">{name}</h1><p className="mt-3 max-w-3xl text-muted-foreground">{description}</p></header>
      <ToolAiProvider copy={assistantCopy(slug,content?.customData.originalFields)}><Questionnaire/></ToolAiProvider>
    </div>
    <ToolEditorialLayout slug={slug} {...editorial} relatedTools={editorial.related}/>
  </main>;
}
