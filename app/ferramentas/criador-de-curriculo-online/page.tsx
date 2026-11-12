import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { ToolAiContent } from "@/components/tools/tool-ai-content";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { resumeEditorial, resumeSlug as slug } from "@/lib/resume-editorial";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride } from "@/lib/site-cms/repository";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";
import ResumeEditor from "./resume-editor";

export const generateMetadata = () => getToolMetadataAsync(slug);

export default async function Page() {
  const content = await getToolOverride(slug);
  if (content && content.status !== "published") notFound();

  const tool = getToolBySlug(slug)!;
  const name = content?.title || tool.name;
  const description = content?.shortDescription || tool.description;
  const schema = buildToolPageSchema({
    slug,
    name,
    description: tool.seoDescription ?? description,
    applicationCategory: "BusinessApplication",
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Arquivos", href: "/ferramentas/arquivos" },
      { name, href: "/ferramentas/" + slug },
    ],
    faqs: content?.contentHtml ? [] : resumeEditorial.faqs,
  });

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <ToolPageShell
      title={name}
      description={description}
      categoryName="Arquivos"
      categoryHref="/ferramentas/arquivos"
      processingMode="hybrid"
      privacyMessage="O rascunho e a geração do PDF ficam no navegador. Somente o campo selecionado é enviado ao serviço de IA quando você solicita uma revisão."
    >
      <ToolAiContent slug={slug}><ResumeEditor /></ToolAiContent>
    </ToolPageShell>
    <ToolEditorialLayout
      slug={slug}
      {...resumeEditorial}
      relatedTools={resumeEditorial.related}
      specificationsTitle="Currículo, IA e exportação"
      afterFaq={<AdSlot placement="tool-bottom" />}
    />
  </>;
}
