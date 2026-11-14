import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import {
  videoLocalToolEditorialContent,
  videoVariantToSlug,
  type VideoLocalVariant,
  type VideoLocalEditorialContent,
} from "@/lib/video-local-tool-editorial-content";
import { doubleVideoEditorial } from "@/lib/double-video-editorial";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

export function VideoToolSeoContent({ variant, customSlug }: { variant?: VideoLocalVariant; customSlug?: string }) {
  const slug = customSlug ?? (variant ? videoVariantToSlug[variant] : "");
  const content: VideoLocalEditorialContent | undefined = customSlug === "montar-video-camera-dupla"
    ? doubleVideoEditorial
    : variant ? videoLocalToolEditorialContent[videoVariantToSlug[variant]] : undefined;
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  if (!content) return null;
  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    applicationCategory: "MultimediaApplication",
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Vídeos", href: "/ferramentas/videos" },
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
        specificationsTitle="Operação, compatibilidade e resultado"
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={content.related}
        relatedArticles={slug === "capturar-frame-video" ? [
          { href: "/blog/como-usar-capturar-frame-video", label: "Como capturar um frame de vídeo: guia prático" },
          { href: "/blog/mp4-mov-avi-hevc-qual-formato-escolher", label: "MP4, MOV, AVI ou HEVC: qual formato escolher?" },
        ] : []}
        afterFaq={<AdSlot placement="tool-bottom" />}
      />
    </>
  );
}

