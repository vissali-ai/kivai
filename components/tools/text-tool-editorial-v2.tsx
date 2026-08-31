import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import {
  textToolEditorialContent,
  type TextToolEditorialSlug,
} from "@/lib/text-tool-editorial-content";
import { getToolBySlug } from "@/lib/tools";

const schemaOverrides: Partial<
  Record<TextToolEditorialSlug, { name: string; description: string }>
> = {
  "contador-de-palavras": {
    name: "Contador de Palavras e Caracteres",
    description:
      "Conte palavras e caracteres com e sem espaços e acompanhe frases, parágrafos, linhas, tempo de leitura, tempo de fala e termos frequentes.",
  },
};

export function TextToolEditorialV2({ slug }: { slug: TextToolEditorialSlug }) {
  const content = textToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schemaOverride = schemaOverrides[slug];
  const schemaName = schemaOverride?.name ?? tool.name;

  const schema = buildToolPageSchema({
    name: schemaName,
    slug,
    description: schemaOverride?.description ?? tool.seoDescription ?? tool.description,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Texto", href: "/ferramentas/texto" },
      { name: schemaName, href: `/ferramentas/${slug}` },
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
        slug={slug}
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
