import type { Metadata } from "next";
import Link from "next/link";
import { ToolRatingSection } from "@/components/tools/tool-rating-section";
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

  return <>
    <InstagramFollowAnalyzerPageClient freeConfig={variants.free} />
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
      <ToolRatingSection slug="analisador-de-seguidores-instagram" />
      <nav aria-label="Ferramentas relacionadas" className="rounded-lg border border-border/70 bg-card/60 px-4 py-4 sm:px-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Ferramentas relacionadas</h2>
        <div className="flex flex-wrap gap-3">
          {[
            {href:"/ferramentas/calculadora-de-engajamento",label:"Calculadora de Engajamento"},
            {href:"/ferramentas/preview-de-post-redes-sociais",label:"Preview de Post"},
            {href:"/ferramentas/planejador-de-conteudo-social-media",label:"Planejador de Conteúdo"}
          ].map(item => <Link key={item.href} href={item.href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{item.label}</Link>)}
        </div>
      </nav>
    </section>
  </>;
}
