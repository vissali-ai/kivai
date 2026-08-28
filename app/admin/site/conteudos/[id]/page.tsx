import { notFound } from "next/navigation";
import { InstagramAnalyzerPublicationSettings } from "@/components/admin/instagram-analyzer-publication-settings";
import { InstagramPlanVariantEditor } from "@/components/admin/instagram-plan-variant-editor";
import { SiteContentEditorV2 } from "@/components/admin/site-content-editor-v2";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getInstagramAnalyzerPlanVariants } from "@/lib/instagram-analyzer-plan-variants";
import { getSiteContentById, listSiteHubs } from "@/lib/site-cms/repository";

// Deployment checkpoint: publica a correção mais recente do editor por plano.
export default async function EditSiteContentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  const [content, hubs] = await Promise.all([getSiteContentById(id), listSiteHubs()]);
  if (!content) notFound();

  if (content.slug === "instagram-follow-analyzer") {
    const baseConfig = await getInstagramAnalyzerConfig();
    const variants = await getInstagramAnalyzerPlanVariants(baseConfig);
    return (
      <>
        <InstagramAnalyzerPublicationSettings initialContent={content} hubs={hubs} />
        <InstagramPlanVariantEditor initialVariants={variants} />
      </>
    );
  }

  return <SiteContentEditorV2 initialContent={content} hubs={hubs} />;
}
