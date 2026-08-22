import { notFound } from "next/navigation";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { getSiteContentById, listSiteHubs } from "@/lib/site-cms/repository";

export default async function EditSiteContentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  const [content, hubs] = await Promise.all([getSiteContentById(id), listSiteHubs()]);
  if (!content) notFound();
  return <SiteContentEditor initialContent={content} hubs={hubs} />;
}
