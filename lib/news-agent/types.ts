export type NewsSource = {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
  defaultCategorySlug: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewsCandidate = {
  sourceId: string;
  sourceName: string;
  categorySlug: string;
  guid: string;
  url: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
};

export type NewsAgentRun = {
  id: string;
  status: "running" | "completed" | "failed";
  sourcesChecked: number;
  itemsFound: number;
  draftsCreated: number;
  itemsSkipped: number;
  error: string;
  startedAt: string;
  finishedAt: string | null;
};

export type GeneratedArticle = {
  title: string;
  subtitle: string;
  excerpt: string;
  contentHtml: string;
  categorySlug: "noticias" | "inteligencia-artificial" | "tecnologia" | "marketing" | "e-commerce";
  tags: string[];
  seoTitle: string;
  metaDescription: string;
  referenceUrls: string[];
};

export type NewsAgentResult = {
  runId: string;
  sourcesChecked: number;
  itemsFound: number;
  draftsCreated: number;
  itemsSkipped: number;
  draftIds: string[];
};
