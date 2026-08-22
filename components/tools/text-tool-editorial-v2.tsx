import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import {
  textToolEditorialContent,
  type TextToolEditorialSlug,
} from "@/lib/text-tool-editorial-content";
import { getToolBySlug } from "@/lib/tools";

export function TextToolEditorialV2({ slug }: { slug: TextToolEditorialSlug }) {
  const content = textToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Texto", href: "/ferramentas/texto" },
      { name: tool.name, href: `/ferramentas/${slug}` },
    ],
    faqs: content.faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <ToolEditorialLayout
        overview={content.overview}
        useCases={content.useCases}
        steps={content.steps}
        specificationsTitle="Métricas, critérios e resultado"
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={content.related}
        afterFaq={<AdSlot placement="tool-bottom" />}
      />
    </>
  );
}
