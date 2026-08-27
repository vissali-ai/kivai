export type SiteContentType = "tool" | "page" | "resource";
export type SitePublicationStatus = "draft" | "published" | "archived";
export type ToolImplementationMode = "auto" | "browser" | "server" | "informational";
export type ToolTechnicalStatus = "not_applicable" | "pending" | "ready";
export type SiteDisplayLocation = "direct" | "home" | "help" | "main_nav" | "footer" | "resource_library";
export type PublicationBlockVisibility = Record<string, boolean>;

export type SiteOriginalFieldType = "text" | "textarea" | "url" | "image" | "number" | "boolean";

export type SiteOriginalField = {
  key: string;
  label: string;
  type: SiteOriginalFieldType;
  value: string | number | boolean;
  helpText?: string;
  visible?: boolean;
};

export type SiteCustomData = {
  originalFields?: SiteOriginalField[];
  blockVisibility?: PublicationBlockVisibility;
  [key: string]: unknown;
};

export type SiteHub = {
  id: string;
  slug: string;
  name: string;
  description: string;
  path: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  status: SitePublicationStatus;
  indexable: boolean;
  includeInSitemap: boolean;
  blockVisibility?: PublicationBlockVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteContent = {
  id: string;
  contentType: SiteContentType;
  slug: string;
  path: string;
  title: string;
  shortDescription: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  hubId: string | null;
  existingToolSlug: string | null;
  toolMode: ToolImplementationMode;
  technicalStatus: ToolTechnicalStatus;
  displayLocation: SiteDisplayLocation;
  showInMostUsed: boolean;
  displayOrder: number;
  status: SitePublicationStatus;
  indexable: boolean;
  includeInSitemap: boolean;
  blockVisibility?: PublicationBlockVisibility;
  customData: SiteCustomData;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteContentInput = Omit<SiteContent, "id" | "createdAt" | "updatedAt" | "publishedAt">;
export type SiteHubInput = Omit<SiteHub, "id" | "createdAt" | "updatedAt" | "publishedAt">;

export type ManagedSiteContent = SiteContent & { virtual?: boolean };

export type SiteService = {
  id: string;
  slug: string;
  path: string;
  title: string;
  shortDescription: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  badge: string;
  serviceType: string;
  audience: string;
  ctaLabel: string;
  ctaUrl: string;
  coverImageUrl: string;
  existingServiceSlug: string | null;
  status: SitePublicationStatus;
  indexable: boolean;
  includeInSitemap: boolean;
  showInServicesIndex: boolean;
  displayOrder: number;
  blockVisibility?: PublicationBlockVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteServiceInput = Omit<SiteService, "id" | "createdAt" | "updatedAt" | "publishedAt">;
export type ManagedSiteService = SiteService & { virtual?: boolean };
