import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { isSlugAvailable, listAllPosts, listCategories, savePost } from "@/lib/blog/repository";
import { slugify } from "@/lib/blog/slug";
import type { PostInput } from "@/lib/blog/types";

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : "";
    const sourceName = typeof body.sourceName === "string" ? body.sourceName.trim().slice(0, 100) : "";
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 320) : "";
    const categorySlug = typeof body.categorySlug === "string" ? body.categorySlug : "noticias";
    let url: URL;
    try { url = new URL(sourceUrl); } catch { throw new Error("Endereço de fonte inválido."); }
    if (url.protocol !== "https:" || !title || !sourceName || sourceUrl.length > 2048) {
      throw new Error("Informe título, nome da fonte e URL HTTPS válidos.");
    }
    const duplicate = (await listAllPosts()).find((post) => post.sourceUrl === sourceUrl);
    if (duplicate) return NextResponse.json({ id: duplicate.id, existing: true });
    const categories = await listCategories();
    const categoryId = categories.find((cat) => cat.slug === categorySlug)?.id ??
      categories.find((cat) => cat.slug === "noticias")?.id ?? null;
    const requestedSlug = slugify(title);
    const slug = await isSlugAvailable(requestedSlug)
      ? requestedSlug : requestedSlug + "-pauta-" + Date.now().toString(36);
    const publishedAt = typeof body.publishedAt === "string" && Number.isFinite(Date.parse(body.publishedAt))
      ? new Date(body.publishedAt).toISOString() : null;
    const input: PostInput = {
      title, slug, subtitle: "", excerpt, content: "<p></p>", status: "draft",
      author: "Kivai", sourceName, sourceUrl, originalPublishedAt: publishedAt,
      categoryId, coverMediaId: null, coverAlt: "", coverCaption: "", coverCredit: "",
      coverSource: "", coverSourceUrl: "", seoTitle: "", metaDescription: "",
      canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "",
      relatedToolSlugs: [], featured: false, featuredOrder: null,
      scheduledAt: null, tagNames: [], origin: "manual", reviewStatus: "not-required",
      generationModel: "gemini-grounded-research", needsCover: false,
      primarySourceUrl: sourceUrl, originalContribution: "",
      relevanceScore: 0, reviewedBy: "", reviewedAt: null,
    };
    const post = await savePost(input);
    if (!post) throw new Error("Não foi possível criar o rascunho.");
    return NextResponse.json({ id: post.id, existing: false }, { status: 201 });
  } catch (error) { return apiError(error); }
}
