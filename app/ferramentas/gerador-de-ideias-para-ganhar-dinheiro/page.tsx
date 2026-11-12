import { notFound } from "next/navigation";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
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
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
    <ToolPageShell
      title={name}
      description={description}
      categoryName="Empresas"
      categoryHref="/ferramentas/empresas"
      processingMode="hybrid"
      showPrivacyNotice={false}
    >
      <ToolAiProvider copy={assistantCopy(slug,content?.customData.originalFields)}><Questionnaire/></ToolAiProvider>
    </ToolPageShell>
    <ToolEditorialLayout slug={slug} {...editorial} relatedTools={editorial.related}/>
  </>;
}
