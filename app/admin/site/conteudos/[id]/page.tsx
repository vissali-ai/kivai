import { notFound } from "next/navigation";
import { InstagramFollowAnalyzerEditor } from "@/components/admin/instagram-follow-analyzer-editor";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getSiteContentById, listSiteHubs } from "@/lib/site-cms/repository";

export default async function EditSiteContentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  const [content, hubs] = await Promise.all([getSiteContentById(id), listSiteHubs()]);
  if (!content) notFound();

  if (content.slug === "instagram-follow-analyzer") {
    return <InstagramFollowAnalyzerEditor initialConfig={await getInstagramAnalyzerConfig()} initialContent={content} hubs={hubs} />;
  }

  return <SiteContentEditor initialContent={content} hubs={hubs} />;
}
