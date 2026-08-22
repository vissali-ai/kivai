import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { TOOL_EDITORIAL_TEMPLATE } from "@/lib/site-cms/editorial-template";
import { listSiteHubs } from "@/lib/site-cms/repository";
import type { ManagedSiteContent } from "@/lib/site-cms/types";

const newContent: ManagedSiteContent = {
  id: "new", contentType: "tool", slug: "", path: "", title: "", shortDescription: "",
  contentHtml: TOOL_EDITORIAL_TEMPLATE, seoTitle: "", seoDescription: "", canonicalUrl: "",
  hubId: null, existingToolSlug: null, toolMode: "auto", technicalStatus: "pending", status: "draft", indexable: false,
  displayLocation: "direct", showInMostUsed: false, displayOrder: 100,
  includeInSitemap: false, publishedAt: null, createdAt: "", updatedAt: "",
};

export default async function NewSiteContentPage() {
  return <SiteContentEditor initialContent={newContent} hubs={await listSiteHubs()} />;
}
