import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import {
  imageToolEditorialContent,
  type ImageToolEditorialSlug,
} from "@/lib/image-tool-editorial-content";
import { imageToolEditorialOverrides } from "@/lib/image-tool-editorial-overrides";
import { redimensionarImagemEditorial } from "@/lib/redimensionar-imagem-editorial";
import { geradorFaviconEditorial } from "@/lib/gerador-favicon-editorial";
import { adicionarMarcaDaguaEditorial } from "@/lib/adicionar-marca-dagua-editorial";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

export function ImageToolEditorialV2({ slug }: { slug: ImageToolEditorialSlug }) {
  const overrideContent =
    slug === "redimensionar-imagem"
      ? redimensionarImagemEditorial
      : slug === "gerador-de-favicon"
        ? geradorFaviconEditorial
        : slug === "adicionar-marca-dagua"
          ? adicionarMarcaDaguaEditorial
          : slug in imageToolEditorialOverrides
            ? imageToolEditorialOverrides[
                slug as keyof typeof imageToolEditorialOverrides
              ]
            : undefined;

  const content = overrideContent ?? imageToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Imagens", href: "/ferramentas/imagens" },
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
