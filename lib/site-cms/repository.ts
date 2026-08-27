import "server-only";

import { sanitizePostHtml, plainText } from "@/lib/blog/sanitize";
import { slugify } from "@/lib/blog/slug";
import { supabaseRest } from "@/lib/blog/supabase";
import { isToolIndexable, tools } from "@/lib/tools";
import type {
  ManagedSiteContent,
  SiteContent,
  SiteContentInput,
  SiteContentType,
  SiteCustomData,
  SiteHub,
  SiteHubInput,
  SitePublicationStatus,
  ToolImplementationMode,
  ToolTechnicalStatus,
  SiteDisplayLocation,
} from "@/lib/site-cms/types";
import { getExistingToolEditorialHtml, inferToolMode } from "@/lib/site-cms/tool-editorial-source";

type HubRow = {
  id: string; slug: string; name: string; description: string; path: string;
  content_html: string; seo_title: string; seo_description: string;
  status: SitePublicationStatus; indexable: boolean; include_in_sitemap: boolean;
  published_at: string | null; created_at: string; updated_at: string;
};

type ContentRow = {
  id: string; content_type: SiteContentType; slug: string; path: string; title: string;
  short_description: string; content_html: string; seo_title: string; seo_description: string;
  canonical_url: string; hub_id: string | null; existing_tool_slug: string | null;
  tool_mode: ToolImplementationMode;
  technical_status: ToolTechnicalStatus;
  display_location: SiteDisplayLocation; show_in_most_used: boolean; display_order: number;
  status: SitePublicationStatus; indexable: boolean; include_in_sitemap: boolean;
  custom_data: SiteCustomData | null;
  published_at: string | null; created_at: string; updated_at: string;
};

const statusValues = new Set<SitePublicationStatus>(["draft", "published", "archived"]);
const typeValues = new Set<SiteContentType>(["tool", "page", "resource"]);

function hubFromRow(row: HubRow): SiteHub {
  return { id: row.id, slug: row.slug, name: row.name, description: row.description, path: row.path,
    contentHtml: row.content_html, seoTitle: row.seo_title, seoDescription: row.seo_description,
    status: row.status, indexable: row.indexable, includeInSitemap: row.include_in_sitemap,
    publishedAt: row.published_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

function contentFromRow(row: ContentRow): SiteContent {
  return { id: row.id, contentType: row.content_type, slug: row.slug, path: row.path, title: row.title,
    shortDescription: row.short_description, contentHtml: row.content_html, seoTitle: row.seo_title,
    seoDescription: row.seo_description, canonicalUrl: row.canonical_url, hubId: row.hub_id,
    existingToolSlug: row.existing_tool_slug, status: row.status, indexable: row.indexable,
    toolMode: row.tool_mode, technicalStatus: row.technical_status,
    displayLocation: row.display_location, showInMostUsed: row.show_in_most_used, displayOrder: row.display_order,
    includeInSitemap: row.include_in_sitemap, customData: row.custom_data ?? {}, publishedAt: row.published_at,
    createdAt: row.created_at, updatedAt: row.updated_at };
}

function cleanStatus(value: unknown): SitePublicationStatus {
  return statusValues.has(value as SitePublicationStatus) ? value as SitePublicationStatus : "draft";
}

function expectedPath(type: SiteContentType, slug: string) {
  return type === "tool" ? `/ferramentas/${slug}` : type === "resource" ? `/recursos/${slug}` : `/paginas/${slug}`;
}

function cleanCustomData(value: unknown): SiteCustomData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as SiteCustomData;
  const originalFields = Array.isArray(source.originalFields)
    ? source.originalFields
      .filter((field) => field && typeof field === "object")
      .map((field) => ({
        key: slugify(String(field.key ?? "field")) || "field",
        label: plainText(String(field.label ?? "Campo")).slice(0, 120),
        type: ["text", "textarea", "url", "image", "number", "boolean"].includes(String(field.type)) ? field.type : "text",
        value: typeof field.value === "boolean" || typeof field.value === "number" ? field.value : String(field.value ?? "").slice(0, 10000),
        helpText: plainText(String(field.helpText ?? "")).slice(0, 300),
      }))
    : [];
  return { ...source, originalFields } as SiteCustomData;
}

function cleanContentInput(value: Partial<SiteContentInput>): SiteContentInput {
  const contentType = typeValues.has(value.contentType as SiteContentType) ? value.contentType as SiteContentType : "page";
  const slug = slugify(String(value.slug ?? ""));
  const title = plainText(String(value.title ?? "")).slice(0, 180);
  if (!slug || title.length < 2) throw new Error("Informe um título e um slug válidos.");
  const requestedStatus = cleanStatus(value.status);
  const technicalStatus = contentType !== "tool" ? "not_applicable" : value.existingToolSlug ? "ready" : value.technicalStatus === "ready" ? "ready" : "pending";
  const status = technicalStatus === "pending" ? "draft" : requestedStatus;
  const published = status === "published";
  return {
    contentType, slug, path: expectedPath(contentType, slug), title,
    shortDescription: plainText(String(value.shortDescription ?? "")).slice(0, 500),
    contentHtml: sanitizePostHtml(String(value.contentHtml ?? "")),
    seoTitle: plainText(String(value.seoTitle ?? "")).slice(0, 180),
    seoDescription: plainText(String(value.seoDescription ?? "")).slice(0, 320),
    canonicalUrl: plainText(String(value.canonicalUrl ?? "")).slice(0, 500),
    hubId: value.hubId || null,
    existingToolSlug: contentType === "tool" && value.existingToolSlug ? slugify(value.existingToolSlug) : null,
    toolMode: contentType === "tool" && ["auto", "browser", "server", "informational"].includes(String(value.toolMode)) ? value.toolMode as ToolImplementationMode : "informational",
    technicalStatus,
    displayLocation: ["direct", "home", "help", "main_nav", "footer", "resource_library"].includes(String(value.displayLocation)) ? value.displayLocation as SiteDisplayLocation : contentType === "resource" ? "resource_library" : "direct",
    showInMostUsed: contentType === "tool" && Boolean(value.showInMostUsed),
    displayOrder: Math.max(0, Math.min(9999, Number(value.displayOrder) || 100)),
    status,
    indexable: published && Boolean(value.indexable),
    includeInSitemap: published && Boolean(value.indexable) && Boolean(value.includeInSitemap),
    customData: cleanCustomData(value.customData),
  };
}

function cleanHubInput(value: Partial<SiteHubInput>): SiteHubInput {
  const slug = slugify(String(value.slug ?? ""));
  const name = plainText(String(value.name ?? "")).slice(0, 120);
  if (!slug || name.length < 2) throw new Error("Informe um nome e um slug válidos para o hub.");
  const status = cleanStatus(value.status);
  const published = status === "published";
  return {
    slug, name, path: `/ferramentas/${slug}`,
    description: plainText(String(value.description ?? "")).slice(0, 500),
    contentHtml: sanitizePostHtml(String(value.contentHtml ?? "")),
    seoTitle: plainText(String(value.seoTitle ?? "")).slice(0, 180),
    seoDescription: plainText(String(value.seoDescription ?? "")).slice(0, 320),
    status, indexable: published && Boolean(value.indexable),
    includeInSitemap: published && Boolean(value.indexable) && Boolean(value.includeInSitemap),
  };
}

function contentPayload(input: SiteContentInput) {
  return { content_type: input.contentType, slug: input.slug, path: input.path, title: input.title,
    short_description: input.shortDescription, content_html: input.contentHtml, seo_title: input.seoTitle,
    seo_description: input.seoDescription, canonical_url: input.canonicalUrl, hub_id: input.hubId,
    existing_tool_slug: input.existingToolSlug, status: input.status, indexable: input.indexable,
    tool_mode: input.toolMode, technical_status: input.technicalStatus,
    display_location: input.displayLocation, show_in_most_used: input.showInMostUsed, display_order: input.displayOrder,
    include_in_sitemap: input.includeInSitemap, custom_data: input.customData,
    published_at: input.status === "published" ? new Date().toISOString() : null };
}

function hubPayload(input: SiteHubInput) {
  return { slug: input.slug, name: input.name, path: input.path, description: input.description,
    content_html: input.contentHtml, seo_title: input.seoTitle, seo_description: input.seoDescription,
    status: input.status, indexable: input.indexable, include_in_sitemap: input.includeInSitemap,
    published_at: input.status === "published" ? new Date().toISOString() : null };
}

export async function listSiteHubs() {
  const rows = await supabaseRest<HubRow[]>("site_hubs?select=*&order=name.asc", { allowMissingConfig: true });
  return rows.map(hubFromRow);
}

export async function getSiteHubBySlug(slug: string, publishedOnly = false) {
  try {
    const filter = publishedOnly ? "&status=eq.published" : "";
    const rows = await supabaseRest<HubRow[]>(`site_hubs?select=*&slug=eq.${encodeURIComponent(slug)}${filter}&limit=1`, { allowMissingConfig: true });
    return rows[0] ? hubFromRow(rows[0]) : null;
  } catch { return null; }
}

export async function createSiteHub(value: Partial<SiteHubInput>) {
  const input = cleanHubInput(value);
  const rows = await supabaseRest<HubRow[]>("site_hubs", { method: "POST", body: JSON.stringify(hubPayload(input)) });
  return hubFromRow(rows[0]);
}

export async function updateSiteHub(id: string, value: Partial<SiteHubInput>) {
  const input = cleanHubInput(value);
  const rows = await supabaseRest<HubRow[]>(`site_hubs?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(hubPayload(input)) });
  if (!rows[0]) throw new Error("Hub não encontrado.");
  return hubFromRow(rows[0]);
}

export async function deleteSiteHub(id: string) {
  await supabaseRest(`site_hubs?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listStoredSiteContents() {
  const rows = await supabaseRest<ContentRow[]>("site_contents?select=*&order=title.asc", { allowMissingConfig: true });
  return rows.map(contentFromRow);
}

export async function listManagedSiteContents(): Promise<ManagedSiteContent[]> {
  const [stored, hubs] = await Promise.all([listStoredSiteContents(), listSiteHubs()]);
  const byExistingSlug = new Map(stored.filter((item) => item.existingToolSlug).map((item) => [item.existingToolSlug, item]));
  const hubBySlug = new Map(hubs.map((hub) => [hub.slug, hub.id]));
  const categoryHub: Record<string, string> = { imagens: "imagens", pdf: "pdfs", calculadoras: "calculadoras", texto: "texto", social: "social-media", video: "videos" };
  const defaultMostUsed = new Map(["removedor-de-fundo", "calculadora-de-porcentagem", "compressor-de-imagens", "gerador-de-qr-code", "pdf-para-imagens", "montar-pdf-para-impressao"].map((slug, index) => [slug, index + 1]));
  const virtual: ManagedSiteContent[] = tools.filter((tool) => !byExistingSlug.has(tool.slug)).map((tool) => ({
    id: `existing:${tool.slug}`, contentType: "tool", slug: tool.slug, path: `/ferramentas/${tool.slug}`,
    title: tool.name, shortDescription: tool.description, contentHtml: "", seoTitle: tool.seoTitle ?? "",
    seoDescription: tool.seoDescription ?? tool.description, canonicalUrl: "", hubId: hubBySlug.get(categoryHub[tool.category]) ?? null,
    existingToolSlug: tool.slug, toolMode: inferToolMode(tool.slug), technicalStatus: "ready", status: "published", indexable: isToolIndexable(tool.slug),
    displayLocation: "direct", showInMostUsed: defaultMostUsed.has(tool.slug), displayOrder: defaultMostUsed.get(tool.slug) ?? 100,
    includeInSitemap: isToolIndexable(tool.slug), customData: { originalFields: [
      { key: "badge", label: "Selo / badge", type: "text", value: tool.badge },
      { key: "hub-filter", label: "Filtro do hub", type: "text", value: tool.hubFilter },
    ] }, publishedAt: null, createdAt: "", updatedAt: "", virtual: true,
  }));
  return [...stored, ...virtual].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

export async function getSiteContentById(id: string) {
  if (id.startsWith("existing:")) {
    const item = (await listManagedSiteContents()).find((entry) => entry.id === id) ?? null;
    return item ? { ...item, contentHtml: getExistingToolEditorialHtml(item.slug) || item.contentHtml } : null;
  }
  const rows = await supabaseRest<ContentRow[]>(`site_contents?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!rows[0]) return null;
  const item = contentFromRow(rows[0]);
  return item.existingToolSlug && !item.contentHtml ? { ...item, contentHtml: getExistingToolEditorialHtml(item.existingToolSlug) } : item;
}

export async function getPublishedSiteContentByPath(path: string) {
  try {
    const rows = await supabaseRest<ContentRow[]>(`site_contents?select=*&path=eq.${encodeURIComponent(path)}&status=eq.published&limit=1`, { allowMissingConfig: true });
    return rows[0] ? contentFromRow(rows[0]) : null;
  } catch { return null; }
}

export async function listPublishedSiteContentsByHub(hubId: string) {
  const rows = await supabaseRest<ContentRow[]>(`site_contents?select=*&hub_id=eq.${encodeURIComponent(hubId)}&status=eq.published&order=title.asc`, { allowMissingConfig: true });
  return rows.map(contentFromRow);
}

export async function getPublishedToolOverride(slug: string) {
  try {
    const rows = await supabaseRest<ContentRow[]>(`site_contents?select=*&existing_tool_slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`, { allowMissingConfig: true });
    return rows[0] ? contentFromRow(rows[0]) : null;
  } catch { return null; }
}

export async function getToolOverride(slug: string) {
  try {
    const rows = await supabaseRest<ContentRow[]>(`site_contents?select=*&existing_tool_slug=eq.${encodeURIComponent(slug)}&limit=1`, { allowMissingConfig: true });
    return rows[0] ? contentFromRow(rows[0]) : null;
  } catch { return null; }
}

export async function createSiteContent(value: Partial<SiteContentInput>) {
  const input = cleanContentInput(value);
  const rows = await supabaseRest<ContentRow[]>("site_contents", { method: "POST", body: JSON.stringify(contentPayload(input)) });
  return contentFromRow(rows[0]);
}

export async function updateSiteContent(id: string, value: Partial<SiteContentInput>) {
  const input = cleanContentInput(value);
  if (id.startsWith("existing:")) return createSiteContent(input);
  const rows = await supabaseRest<ContentRow[]>(`site_contents?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(contentPayload(input)) });
  if (!rows[0]) throw new Error("Conteúdo não encontrado.");
  return contentFromRow(rows[0]);
}

export async function deleteSiteContent(id: string) {
  if (id.startsWith("existing:")) throw new Error("A ferramenta original faz parte do código e não pode ser excluída pelo painel.");
  await supabaseRest(`site_contents?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listSitemapSiteContent() {
  const [contents, hubs] = await Promise.all([
    supabaseRest<ContentRow[]>("site_contents?select=*&status=eq.published&indexable=eq.true&include_in_sitemap=eq.true", { allowMissingConfig: true }),
    supabaseRest<HubRow[]>("site_hubs?select=*&status=eq.published&indexable=eq.true&include_in_sitemap=eq.true", { allowMissingConfig: true }),
  ]);
  return { contents: contents.map(contentFromRow), hubs: hubs.map(hubFromRow) };
}

export async function listPublishedFeaturedTools() {
  try {
    const managed = await listManagedSiteContents();
    return managed.filter((item) => item.contentType === "tool" && item.status === "published" && item.technicalStatus === "ready" && item.showInMostUsed).sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 6);
  } catch {
    const slugs = ["removedor-de-fundo", "calculadora-de-porcentagem", "compressor-de-imagens", "gerador-de-qr-code", "pdf-para-imagens", "montar-pdf-para-impressao"];
    return slugs.flatMap((slug, index) => { const tool = tools.find((item) => item.slug === slug); return tool ? [{ id: `existing:${slug}`, contentType: "tool" as const, slug, path: `/ferramentas/${slug}`, title: tool.name, shortDescription: tool.description, contentHtml: "", seoTitle: tool.seoTitle ?? "", seoDescription: tool.seoDescription ?? tool.description, canonicalUrl: "", hubId: null, existingToolSlug: slug, toolMode: inferToolMode(slug), technicalStatus: "ready" as const, displayLocation: "direct" as const, showInMostUsed: true, displayOrder: index + 1, status: "published" as const, indexable: isToolIndexable(slug), includeInSitemap: isToolIndexable(slug), customData: {}, publishedAt: null, createdAt: "", updatedAt: "", virtual: true }] : []; });
  }
}

export async function listPublishedContentsAt(location: SiteDisplayLocation, contentType?: SiteContentType) {
  try {
    const typeFilter = contentType ? `&content_type=eq.${contentType}` : "";
    const rows = await supabaseRest<ContentRow[]>(`site_contents?select=*&status=eq.published&display_location=eq.${location}${typeFilter}&order=display_order.asc,title.asc`, { allowMissingConfig: true });
    return rows.map(contentFromRow);
  } catch { return []; }
}
