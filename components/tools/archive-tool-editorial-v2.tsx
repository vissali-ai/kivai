import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import {
  archiveToolEditorialContent,
  type ArchiveToolEditorialSlug,
} from "@/lib/archive-tool-editorial-content";
import { buildToolPageSchema } from "@/lib/tool-page-schema";

export function ArchiveToolEditorialV2({ slug }: { slug: ArchiveToolEditorialSlug }) {
  const content = archiveToolEditorialContent[slug];

  const schema = buildToolPageSchema({
    name: content.name,
    slug,
    description: content.description,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Arquivos", href: "/ferramentas/arquivos" },
      { name: content.name, href: `/ferramentas/${slug}` },
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
        specificationsTitle="Formatos, limites e resultado"
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
