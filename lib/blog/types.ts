export type PostStatus = "draft" | "published" | "scheduled" | "archived";
export type PostOrigin = "manual" | "rss-agent";
export type ReviewStatus =
  | "not-required"
  | "collected"
  | "selected"
  | "researching"
  | "awaiting-review"
  | "approved"
  | "rejected";

export type MediaSource =
  | "own"
  | "press"
  | "press-kit"
  | "stock"
  | "creative-commons"
  | "other";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Media = {
  id: string;
  url: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  alt: string;
  caption: string;
  credit: string;
  source: MediaSource;
  sourceUrl: string;
  contentHash: string;
  createdAt: string;
};

export type Post = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  author: string;
  sourceName: string;
  sourceUrl: string;
  originalPublishedAt: string | null;
  categoryId: string | null;
  category: Category | null;
  tags: Tag[];
  coverMediaId: string | null;
  cover: Media | null;
  coverAlt: string;
  coverCaption: string;
  coverCredit: string;
  coverSource: string;
  coverSourceUrl: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  relatedToolSlugs: string[];
  featured: boolean;
  featuredOrder: number | null;
  origin: PostOrigin;
  reviewStatus: ReviewStatus;
  generationModel: string;
  needsCover: boolean;
  primarySourceUrl: string;
  originalContribution: string;
  relevanceScore: number;
  reviewedBy: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
};

export type PostInput = Omit<
  Post,
  "id" | "category" | "tags" | "cover" | "createdAt" | "updatedAt" | "publishedAt"
> & {
  id?: string;
  tagNames: string[];
  publishedAt?: string | null;
};

export type DashboardFilters = {
  query?: string;
  status?: PostStatus | "all";
  origin?: PostOrigin | "all";
  categoryId?: string;
  page?: number;
  pageSize?: number;
};
