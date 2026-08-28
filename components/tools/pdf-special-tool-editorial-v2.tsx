import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { pdfParaHtmlEditorialOverride } from "@/lib/pdf-para-html-editorial-override";
import {
  pdfSpecialToolEditorialContent,
  type PdfSpecialToolEditorialSlug,
} from "@/lib/pdf-special-tool-editorial-content";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

const pdfParaHtmlDescription =
  "Converta o texto extraível de PDFs digitais em HTML, com modo estruturado ou reposicionamento visual do texto. Não inclui OCR nem reconstrução de imagens.";

export function PdfSpecialToolEditorialV2({ slug }: { slug: PdfSpecialToolEditorialSlug }) {
  const content = slug === "pdf-para-html" ? pdfParaHtmlEditorialOverride : pdfSpecialToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: slug === "pdf-para-html" ? pdfParaHtmlDescription : tool.seoDescription ?? tool.description,
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
        slug={slug}
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
