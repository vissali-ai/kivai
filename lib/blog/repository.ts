import "server-only";

import type { Category, DashboardFilters, Media, Post, PostInput, Tag } from "@/lib/blog/types";
import { isBlogDatabaseConfigured } from "@/lib/blog/config";
import { sanitizePostHtml, plainText } from "@/lib/blog/sanitize";
import { slugify } from "@/lib/blog/slug";
import { supabaseRest } from "@/lib/blog/supabase";

type DbCategory = { id: string; name: string; slug: string; description: string | null; created_at: string };
type DbTag = { id: string; name: string; slug: string };
type DbMedia = {
  id: string; url: string; storage_path: string; filename: string; mime_type: string;
  width: number; height: number; size: number; alt: string | null; caption: string | null;
  credit: string | null; source: Media["source"]; source_url: string | null;
  content_hash: string; created_at: string;
};
type DbPost = {
  id: string; title: string; subtitle: string | null; slug: string; excerpt: string;
  content: string; status: Post["status"]; author: string; source_name: string | null;
  source_url: string | null; original_published_at: string | null; category_id: string | null;
  cover_media_id: string | null; cover_alt: string | null; cover_caption: string | null;
  cover_credit: string | null; cover_source: string | null; cover_source_url: string | null;
  seo_title: string | null; meta_description: string | null; canonical_url: string | null;
  og_title: string | null; og_description: string | null; og_image: string | null;
  related_tool_slugs: string[] | null; created_at: string; updated_at: string;
  featured: boolean | null; featured_order: number | null;
  origin: Post["origin"] | null; review_status: Post["reviewStatus"] | null;
  generation_model: string | null; needs_cover: boolean | null;
  published_at: string | null; scheduled_at: string | null;
  category?: DbCategory | null; cover?: DbMedia | null;
  post_tags?: { tag: DbTag | null }[];
};
type DbScheduledPost = Pick<DbPost, "id" | "scheduled_at" | "origin">;

const postSelect = "*,category:blog_categories(*),cover:blog_media(*),post_tags:blog_post_tags(tag:blog_tags(*))";

function mapCategory(row: DbCategory): Category {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description ?? "", createdAt: row.created_at };
}

function mapTag(row: DbTag): Tag { return { id: row.id, name: row.name, slug: row.slug }; }

function mapMedia(row: DbMedia): Media {
  return {
    id: row.id, url: row.url, storagePath: row.storage_path, filename: row.filename,
    mimeType: row.mime_type, width: row.width, height: row.height, size: row.size,
    alt: row.alt ?? "", caption: row.caption ?? "", credit: row.credit ?? "",
    source: row.source, sourceUrl: row.source_url ?? "", contentHash: row.content_hash,
    createdAt: row.created_at,
  };
}

function mapPost(row: DbPost): Post {
  return {
    id: row.id, title: row.title, subtitle: row.subtitle ?? "", slug: row.slug,
    excerpt: row.excerpt, content: row.content, status: row.status, author: row.author,
    sourceName: row.source_name ?? "", sourceUrl: row.source_url ?? "",
    originalPublishedAt: row.original_published_at, categoryId: row.category_id,
    category: row.category ? mapCategory(row.category) : null,
    tags: (row.post_tags ?? []).flatMap((item) => item.tag ? [mapTag(item.tag)] : []),
    coverMediaId: row.cover_media_id, cover: row.cover ? mapMedia(row.cover) : null,
    coverAlt: row.cover_alt ?? "", coverCaption: row.cover_caption ?? "",
    coverCredit: row.cover_credit ?? "", coverSource: row.cover_source ?? "",
    coverSourceUrl: row.cover_source_url ?? "", seoTitle: row.seo_title ?? "",
    metaDescription: row.meta_description ?? "", canonicalUrl: row.canonical_url ?? "",
    ogTitle: row.og_title ?? "", ogDescription: row.og_description ?? "",
    ogImage: row.og_image ?? "", relatedToolSlugs: row.related_tool_slugs ?? [],
    featured: row.featured ?? false, featuredOrder: row.featured_order ?? null,
    origin: row.origin ?? "manual", reviewStatus: row.review_status ?? "not-required",
    generationModel: row.generation_model ?? "", needsCover: row.needs_cover ?? false,
    createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
  };
}

function encode(value: string) { return encodeURIComponent(value); }

export async function listCategories() {
  const rows = await supabaseRest<DbCategory[]>("blog_categories?select=*&order=name.asc", { allowMissingConfig: true });
  return rows.map(mapCategory);
}

export async function createCategory(input: { name: string; slug?: string; description?: string }) {
  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) throw new Error("Nome e slug da categoria são obrigatórios.");
  const rows = await supabaseRest<DbCategory[]>("blog_categories", {
    method: "POST", body: JSON.stringify({ name, slug, description: input.description?.trim() || null }),
  });
  return mapCategory(rows[0]);
}

export async function updateCategory(id: string, input: { name: string; slug?: string; description?: string }) {
  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name || !slug) throw new Error("Nome e slug da categoria são obrigatórios.");
  const rows = await supabaseRest<DbCategory[]>(`blog_categories?id=eq.${encode(id)}`, {
    method: "PATCH", body: JSON.stringify({ name, slug, description: input.description?.trim() || null }),
  });
  return mapCategory(rows[0]);
}

export async function deleteCategory(id: string) {
  await supabaseRest(`blog_categories?id=eq.${encode(id)}`, { method: "DELETE" });
}

export async function listPosts(filters: DashboardFilters = {}) {
  if (!isBlogDatabaseConfigured()) return [];
  const rows = await supabaseRest<DbPost[]>(`blog_posts?select=${encode(postSelect)}&order=updated_at.desc`);
  let posts = rows.map(mapPost);
  if (filters.query) posts = posts.filter((post) => post.title.toLocaleLowerCase("pt-BR").includes(filters.query!.toLocaleLowerCase("pt-BR")));
  if (filters.status && filters.status !== "all") posts = posts.filter((post) => post.status === filters.status);
  if (filters.categoryId) posts = posts.filter((post) => post.categoryId === filters.categoryId);
  const pageSize = filters.pageSize ?? 20;
  const start = ((filters.page ?? 1) - 1) * pageSize;
  return posts.slice(start, start + pageSize);
}

export async function listAllPosts() {
  if (!isBlogDatabaseConfigured()) return [];
  const rows = await supabaseRest<DbPost[]>(`blog_posts?select=${encode(postSelect)}&order=updated_at.desc`);
  return rows.map(mapPost);
}

export async function publishDueScheduledPosts() {
  if (!isBlogDatabaseConfigured()) return 0;
  const now = new Date().toISOString();
  const rows = await supabaseRest<DbScheduledPost[]>(
    `blog_posts?select=id,scheduled_at,origin&status=eq.scheduled&scheduled_at=lte.${encode(now)}`,
  );
  await Promise.all(rows.map((post) => supabaseRest(`blog_posts?id=eq.${encode(post.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "published",
      published_at: post.scheduled_at || now,
      scheduled_at: null,
      ...(post.origin === "rss-agent" ? { review_status: "approved" } : {}),
    }),
  })));
  return rows.length;
}

export async function listPublishedPosts() {
  await publishDueScheduledPosts();
  const posts = await listAllPosts();
  const now = Date.now();
  return posts
    .filter((post) => post.status === "published" || (post.status === "scheduled" && Boolean(post.scheduledAt) && new Date(post.scheduledAt!).getTime() <= now))
    .sort((left, right) => new Date(right.publishedAt ?? right.scheduledAt ?? right.createdAt).getTime() - new Date(left.publishedAt ?? left.scheduledAt ?? left.createdAt).getTime());
}

export async function listFeaturedPosts() {
  const posts = await listPublishedPosts();
  return posts
    .filter((post) => post.featured)
    .sort((left, right) => (left.featuredOrder ?? 99) - (right.featuredOrder ?? 99) || new Date(right.publishedAt ?? right.createdAt).getTime() - new Date(left.publishedAt ?? left.createdAt).getTime())
    .slice(0, 12);
}

export async function getPostById(id: string) {
  if (!isBlogDatabaseConfigured()) return null;
  const rows = await supabaseRest<DbPost[]>(`blog_posts?select=${encode(postSelect)}&id=eq.${encode(id)}&limit=1`);
  return rows[0] ? mapPost(rows[0]) : null;
}

export async function getPublishedPostBySlug(slug: string) {
  const posts = await listPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function isSlugAvailable(slug: string, excludedId?: string) {
  if (!isBlogDatabaseConfigured()) return true;
  const rows = await supabaseRest<{ id: string }[]>(`blog_posts?select=id&slug=eq.${encode(slug)}&limit=1`);
  return !rows[0] || rows[0].id === excludedId;
}

function validatePost(input: PostInput) {
  const title = input.title.trim();
  const slug = slugify(input.slug || title);
  const excerpt = input.excerpt.trim();
  const author = input.author.trim();
  const content = sanitizePostHtml(input.content);
  if (!title || !slug) throw new Error("Título e slug são obrigatórios.");
  if (!["draft", "archived"].includes(input.status) && (!excerpt || !author || !plainText(content))) {
    throw new Error("Resumo, autor e conteúdo são obrigatórios para publicar ou agendar.");
  }
  if (!["draft", "archived"].includes(input.status) && !input.categoryId) {
    throw new Error("Escolha uma categoria antes de publicar ou agendar.");
  }
  if (input.status === "scheduled" && !input.scheduledAt) throw new Error("Defina a data do agendamento.");
  if (input.featured && (!input.featuredOrder || input.featuredOrder < 1 || input.featuredOrder > 12)) {
    throw new Error("Defina uma posição de destaque entre 1 e 12.");
  }
  if (input.origin === "rss-agent" && !["draft", "archived"].includes(input.status) && !input.coverMediaId) {
    throw new Error("Adicione uma imagem de capa antes de publicar uma matéria preparada pelo agente.");
  }
  return { title, slug, excerpt, author, content };
}

function toPostRow(input: PostInput) {
  const clean = validatePost(input);
  const publishNow = input.status === "published";
  return {
    title: clean.title, subtitle: input.subtitle.trim() || null, slug: clean.slug,
    excerpt: clean.excerpt, content: clean.content, status: input.status, author: clean.author || "Kivai",
    source_name: input.sourceName.trim() || null, source_url: input.sourceUrl.trim() || null,
    original_published_at: input.originalPublishedAt || null, category_id: input.categoryId || null,
    cover_media_id: input.coverMediaId || null, cover_alt: input.coverAlt.trim() || null,
    cover_caption: input.coverCaption.trim() || null, cover_credit: input.coverCredit.trim() || null,
    cover_source: input.coverSource.trim() || null, cover_source_url: input.coverSourceUrl.trim() || null,
    seo_title: input.seoTitle.trim() || null, meta_description: input.metaDescription.trim() || null,
    canonical_url: input.canonicalUrl.trim() || null, og_title: input.ogTitle.trim() || null,
    og_description: input.ogDescription.trim() || null, og_image: input.ogImage.trim() || null,
    related_tool_slugs: input.relatedToolSlugs, scheduled_at: input.status === "scheduled" ? input.scheduledAt : null,
    featured: input.featured, featured_order: input.featured ? input.featuredOrder : null,
    origin: input.origin, review_status: input.status === "published" && input.origin === "rss-agent" ? "approved" : input.reviewStatus,
    generation_model: input.generationModel || null,
    needs_cover: input.origin === "rss-agent" ? !input.coverMediaId : false,
    published_at: publishNow ? (input.publishedAt || new Date().toISOString()) : input.status === "archived" ? input.publishedAt : null,
  };
}

async function syncPostTags(postId: string, names: string[]) {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, 20);
  await supabaseRest(`blog_post_tags?post_id=eq.${encode(postId)}`, { method: "DELETE" });
  if (!unique.length) return;
  const slugs = unique.map(slugify);
  await supabaseRest<DbTag[]>("blog_tags?on_conflict=slug", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(unique.map((name, index) => ({ name, slug: slugs[index] }))),
  });
  const tags = await supabaseRest<DbTag[]>(`blog_tags?select=*&slug=in.(${slugs.map(encode).join(",")})`);
  await supabaseRest("blog_post_tags", {
    method: "POST", body: JSON.stringify(tags.map((tag) => ({ post_id: postId, tag_id: tag.id }))),
  });
}

export async function savePost(input: PostInput) {
  const row = toPostRow(input);
  if (row.featured) {
    const posts = await listAllPosts();
    const featuredCount = posts.filter((post) => post.featured && post.id !== input.id).length;
    if (featuredCount >= 12) throw new Error("O limite de 12 notícias em destaque já foi atingido.");
  }
  if (!(await isSlugAvailable(row.slug, input.id))) throw new Error("Este slug já está em uso por outra matéria.");
  const rows = input.id
    ? await supabaseRest<DbPost[]>(`blog_posts?id=eq.${encode(input.id)}`, { method: "PATCH", body: JSON.stringify(row) })
    : await supabaseRest<DbPost[]>("blog_posts", { method: "POST", body: JSON.stringify(row) });
  if (!rows[0]) throw new Error("Não foi possível salvar a matéria.");
  await syncPostTags(rows[0].id, input.tagNames);
  return getPostById(rows[0].id);
}

export async function setPostStatus(id: string, status: Post["status"]) {
  const post = await getPostById(id);
  if (!post) throw new Error("Matéria não encontrada.");
  return savePost({
    ...post,
    id,
    status,
    featured: status === "archived" ? false : post.featured,
    featuredOrder: status === "archived" ? null : post.featuredOrder,
    tagNames: post.tags.map((tag) => tag.name),
    publishedAt: post.publishedAt,
  });
}

export async function deletePost(id: string) {
  await supabaseRest(`blog_posts?id=eq.${encode(id)}`, { method: "DELETE" });
}

export async function listMedia(query = "") {
  if (!isBlogDatabaseConfigured()) return [];
  const rows = await supabaseRest<DbMedia[]>("blog_media?select=*&order=created_at.desc");
  const media = rows.map(mapMedia);
  return query ? media.filter((item) => item.filename.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : media;
}

export async function findMediaByHash(hash: string) {
  if (!isBlogDatabaseConfigured()) return null;
  const rows = await supabaseRest<DbMedia[]>(`blog_media?select=*&content_hash=eq.${encode(hash)}&limit=1`);
  return rows[0] ? mapMedia(rows[0]) : null;
}

export async function createMedia(input: Omit<Media, "id" | "createdAt">) {
  const rows = await supabaseRest<DbMedia[]>("blog_media", { method: "POST", body: JSON.stringify({
    url: input.url, storage_path: input.storagePath, filename: input.filename, mime_type: input.mimeType,
    width: input.width, height: input.height, size: input.size, alt: input.alt || null,
    caption: input.caption || null, credit: input.credit || null, source: input.source,
    source_url: input.sourceUrl || null, content_hash: input.contentHash,
  }) });
  return mapMedia(rows[0]);
}

export async function updateMedia(id: string, input: Pick<Media, "alt" | "caption" | "credit" | "source" | "sourceUrl">) {
  const rows = await supabaseRest<DbMedia[]>(`blog_media?id=eq.${encode(id)}`, { method: "PATCH", body: JSON.stringify({
    alt: input.alt.trim() || null, caption: input.caption.trim() || null, credit: input.credit.trim() || null,
    source: input.source, source_url: input.sourceUrl.trim() || null,
  }) });
  return mapMedia(rows[0]);
}

export async function mediaUsageCount(id: string) {
  const media = (await listMedia()).find((item) => item.id === id);
  const rows = await supabaseRest<{ id: string; cover_media_id: string | null; content: string }[]>("blog_posts?select=id,cover_media_id,content");
  return rows.filter((post) => post.cover_media_id === id || Boolean(media?.url && post.content.includes(media.url))).length;
}

export async function deleteMediaRecord(id: string) {
  await supabaseRest(`blog_media?id=eq.${encode(id)}`, { method: "DELETE" });
}
