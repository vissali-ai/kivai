import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { getPostById } from "@/lib/blog/repository";
import { getBlogPublicationControlsById, updateBlogPublicationControls } from "@/lib/blog/publication-controls";

type Context = { params: Promise<{ id: string }> };

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
    const body = await request.json() as { indexable?: boolean; includeInSitemap?: boolean };
    const controls = await updateBlogPublicationControls(id, {
      indexable: Boolean(body.indexable),
      includeInSitemap: Boolean(body.includeInSitemap),
    });
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json(controls);
  } catch (error) {
    return apiError(error);
  }
}
