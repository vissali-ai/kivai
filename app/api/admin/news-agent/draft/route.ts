import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { editorialApiError } from "@/lib/blog/editorial-api";
import { isSlugAvailable, listAllPosts, listCategories, savePost } from "@/lib/blog/repository";
import { slugify } from "@/lib/blog/slug";
import type { PostInput } from "@/lib/blog/types";
import { generateEditorialBase, saveEditorialBase, validateSourceUrl } from "@/lib/blog/editorial-ai";

export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : "";
    const suppliedSourceName = typeof body.sourceName === "string" ? body.sourceName.trim().slice(0, 100) : "";
    const sourceUrl = validateSourceUrl(typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "");
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 320) : "";
    const categorySlug = typeof body.categorySlug === "string" ? body.categorySlug : "noticias";
    const selectedModel = typeof body.model === "string" ? body.model : undefined;
    let url: URL;
    try { url = new URL(sourceUrl); } catch { throw new Error("Endereço de fonte inválido."); }
    if (url.protocol !== "https:" || sourceUrl.length > 2048) {
      throw new Error("Informe uma URL HTTPS válida.");
    }
    const sourceName = suppliedSourceName || url.hostname.replace(/^www\./, "");
    const duplicate = (await listAllPosts()).find((post) => {
      try { return validateSourceUrl(post.sourceUrl) === sourceUrl; } catch { return false; }
    });
    if (duplicate) return NextResponse.json({ id: duplicate.id, existing: true });
    const categories = await listCategories();
    const categoryId = categories.find((cat) => cat.slug === categorySlug)?.id ??
      categories.find((cat) => cat.slug === "noticias")?.id ?? null;
    const publishedAt = typeof body.publishedAt === "string" && Number.isFinite(Date.parse(body.publishedAt))
      ? new Date(body.publishedAt).toISOString() : null;
    // A base é escrita a partir do artigo acessível, não copiada do veículo.
    // Se o Gemini não conseguir ler a fonte, nenhum novo rascunho incompleto será criado.
    const base = await generateEditorialBase({ sourceUrl, sourceTitle: title || "Notícia indicada pelo editor", sourceName, excerpt, model: selectedModel });
    const requestedSlug = slugify(base.title);
    const slug = await isSlugAvailable(requestedSlug)
      ? requestedSlug : requestedSlug + "-pauta-" + Date.now().toString(36);
    const input: PostInput = {
      title: base.title, slug, subtitle: base.subtitle, excerpt: base.excerpt, content: base.contentHtml, status: "draft",
      author: "Kivai", sourceName, sourceUrl, originalPublishedAt: publishedAt,
      categoryId, coverMediaId: null, coverAlt: "", coverCaption: "", coverCredit: "",
      coverSource: "", coverSourceUrl: "", seoTitle: base.seoTitle, metaDescription: base.metaDescription,
      canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "",
      relatedToolSlugs: [], featured: false, featuredOrder: null,
      scheduledAt: null, tagNames: base.tags, origin: "manual", reviewStatus: "not-required",
      generationModel: base.model, needsCover: false,
      primarySourceUrl: sourceUrl, originalContribution: "",
      relevanceScore: 0, reviewedBy: "", reviewedAt: null,
    };
    const post = await savePost(input);
    if (!post) throw new Error("Não foi possível criar o rascunho.");
    try {
      await saveEditorialBase(post.id, base);
    } catch {
      // A reportagem já está no CMS. Não apresentar falha total nem estimular uma segunda criação.
      console.warn("[kivai-editorial] Rascunho salvo; preservação da base indisponível.");
      return NextResponse.json({ id: post.id, existing: false, baseReady: false,
        warning: "Rascunho salvo. A cópia da reportagem-base não pôde ser preservada; use Preparar reportagem no editor para recuperá-la." },
      { status: 201, headers: { "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ id: post.id, existing: false, baseReady: true }, { status: 201 });
  } catch (error) {
    return editorialApiError(error);
  }
}
