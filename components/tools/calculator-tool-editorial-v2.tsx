import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { generalToolEditorialContent } from "@/lib/general-tool-editorial-content";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

export type CalculatorToolEditorialSlug =
  | "calculadora-de-roas"
  | "calculadora-de-roi"
  | "calculadora-de-markup"
  | "calculadora-de-margem"
  | "calculadora-de-desconto"
  | "calculadora-de-porcentagem";

export function CalculatorToolEditorialV2({ slug }: { slug: CalculatorToolEditorialSlug }) {
  const content = generalToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    applicationCategory: content.applicationCategory,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/#ferramentas" },
      { name: "Calculadoras", href: "/ferramentas/calculadoras" },
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
        specificationsTitle="Cálculo, critérios e resultado"
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={content.related.filter((item) => item.href !== `/ferramentas/${slug}`)}
        afterFaq={<AdSlot placement="tool-bottom" />}
      />
    </>
  );
}
