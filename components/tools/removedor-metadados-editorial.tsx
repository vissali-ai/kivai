import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { removedorMetadadosTool } from "@/lib/removedor-metadados-tool";
import { buildToolPageSchema } from "@/lib/tool-page-schema";

import { removedorMetadadosEditorialContent as content } from "@/lib/removedor-metadados-editorial-content";

const slug = removedorMetadadosTool.slug;
const name = removedorMetadadosTool.name;

export function RemovedorMetadadosEditorial() {
  const schema = buildToolPageSchema({
    name,
    slug,
    description: removedorMetadadosTool.seoDescription,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Imagens", href: "/ferramentas/imagens" },
      { name, href: removedorMetadadosTool.href },
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
