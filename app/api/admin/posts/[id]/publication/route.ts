import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { getPostById } from "@/lib/blog/repository";
import { getBlogPublicationControlsById, updateBlogPublicationControls } from "@/lib/blog/publication-controls";
import { supabaseRest } from "@/lib/blog/supabase";

type Context = { params: Promise<{ id: string }> };

const deletableBlocks = new Set(["header", "subtitle", "cover", "content", "source", "tags", "relatedTools", "share"]);

async function clearDeletedBlockData(id: string, deletedBlocks: string[]) {
  const deleted = new Set(deletedBlocks.filter((key) => deletableBlocks.has(key)));
  const patch: Record<string, unknown> = {};

  if (deleted.has("subtitle")) patch.subtitle = null;
  if (deleted.has("cover")) {
    patch.cover_media_id = null;
    patch.cover_alt = null;
    patch.cover_caption = null;
    patch.cover_credit = null;
    patch.cover_source = null;
    patch.cover_source_url = null;
  }
  if (deleted.has("content")) patch.content = "";
  if (deleted.has("source")) {
    patch.source_name = null;
    patch.source_url = null;
    patch.primary_source_url = null;
  }
  if (deleted.has("relatedTools")) patch.related_tool_slugs = [];

  if (Object.keys(patch).length) {
    await supabaseRest(`blog_posts?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }
  if (deleted.has("tags")) {
    await supabaseRest(`blog_post_tags?post_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    return NextResponse.json(await getBlogPublicationControlsById((await params).id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const post = await getPostById(id);
    if (!post) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
    const body = await request.json() as {
      indexable?: boolean;
      includeInSitemap?: boolean;
      blockVisibility?: Record<string, boolean>;
      deletedBlocks?: string[];
    };
    const deletedBlocks = Array.isArray(body.deletedBlocks) ? body.deletedBlocks.filter((key) => typeof key === "string" && deletableBlocks.has(key)) : [];
    const blockVisibility = { ...(body.blockVisibility ?? {}) };
    for (const key of deletedBlocks) {
      blockVisibility[key] = false;
      blockVisibility[`__deleted_${key}`] = true;
    }

    await clearDeletedBlockData(id, deletedBlocks);
    const controls = await updateBlogPublicationControls(id, {
      indexable: Boolean(body.indexable),
      includeInSitemap: Boolean(body.includeInSitemap),
      blockVisibility,
    });
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json(controls);
  } catch (error) {
    return apiError(error);
  }
}