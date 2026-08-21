import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import {
  pdfToolEditorialContent,
  type PdfToolEditorialSlug,
} from "@/lib/pdf-tool-editorial-content";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

export function PdfToolEditorialV2({ slug }: { slug: PdfToolEditorialSlug }) {
  const content = pdfToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "PDFs", href: "/ferramentas/pdfs" },
      { name: tool.name, href: `/ferramentas/${slug}` },
    ],
    faqs: content.faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <ToolEditorialLayout
        overview={content.overview}
        useCases={content.useCases}
        steps={content.steps}
        specificationsTitle="Operação, formatos e resultado"
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={content.related}
        afterFaq={<AdSlot placement="tool-bottom" variant="banner" />}
      />
    </>
  );
}
