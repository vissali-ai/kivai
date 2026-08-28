import type { Metadata } from "next";
import { InstagramFollowAnalyzerPageClient } from "@/components/tools/instagram-follow-analyzer-page-client";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getInstagramAnalyzerPlanVariants } from "@/lib/instagram-analyzer-plan-variants";
import { getToolOverride } from "@/lib/site-cms/repository";

// Deployment checkpoint: publica a versão mais recente da personalização por plano.
export async function generateMetadata(): Promise<Metadata> {
  const content = await getToolOverride("instagram-follow-analyzer");
  const seoTitle = content?.seoTitle || "Quem deixou de seguir no Instagram | Kivai";
  return {
    title: { absolute: seoTitle },
    description: content?.seoDescription || "Descubra quem não segue você de volta no Instagram usando a exportação oficial da Meta, sem informar sua senha.",
    alternates: { canonical: content?.canonicalUrl || "/ferramentas/instagram-follow-analyzer" },
    robots: content?.status === "published" && content.indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function InstagramFollowAnalyzerPage() {
  const baseConfig = await getInstagramAnalyzerConfig();
  const variants = await getInstagramAnalyzerPlanVariants(baseConfig);

  return <InstagramFollowAnalyzerPageClient freeConfig={variants.free} />;
}
