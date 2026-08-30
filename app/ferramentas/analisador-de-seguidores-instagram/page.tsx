import type { Metadata } from "next";
import { InstagramFollowAnalyzerPageClient } from "@/components/tools/instagram-follow-analyzer-page-client";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getInstagramAnalyzerPlanVariants } from "@/lib/instagram-analyzer-plan-variants";
import { getToolOverride } from "@/lib/site-cms/repository";

const TOOL_CONFIG_KEY = "instagram-follow-analyzer";
const PUBLIC_PATH = "/ferramentas/analisador-de-seguidores-instagram";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getToolOverride(TOOL_CONFIG_KEY);
  const seoTitle = content?.seoTitle || "Quem Não Me Segue no Instagram? Analise seus Seguidores | Kivai";
  return {
    title: { absolute: seoTitle },
    description: content?.seoDescription || "Descubra quem não segue você de volta, compare seguidores e contas seguidas e analise seu Instagram usando a exportação oficial da Meta.",
    alternates: { canonical: content?.canonicalUrl || PUBLIC_PATH },
    robots: content?.status === "published" && content.indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function InstagramFollowersAnalyzerPage() {
  const baseConfig = await getInstagramAnalyzerConfig();
  const variants = await getInstagramAnalyzerPlanVariants(baseConfig);

  return <InstagramFollowAnalyzerPageClient freeConfig={variants.free} />;
}
