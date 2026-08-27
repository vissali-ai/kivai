import { SiteContentEditorV2 } from "@/components/admin/site-content-editor-v2";
import { listSiteHubs } from "@/lib/site-cms/repository";
import type { ManagedSiteContent } from "@/lib/site-cms/types";

const newContent: ManagedSiteContent = {
  id: "new", contentType: "tool", slug: "", path: "", title: "", shortDescription: "",
  contentHtml: "", seoTitle: "", seoDescription: "", canonicalUrl: "",
  hubId: null, existingToolSlug: null, toolMode: "auto", technicalStatus: "pending", status: "draft", indexable: false,
  displayLocation: "direct", showInMostUsed: false, displayOrder: 100,
  includeInSitemap: false, customData: { originalFields: [] }, publishedAt: null, createdAt: "", updatedAt: "",
};

export default async function NewSiteContentPage() {
  return <SiteContentEditorV2 initialContent={newContent} hubs={await listSiteHubs()} />;
}
