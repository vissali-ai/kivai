import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { deletePost, getPostById, savePost, setPostStatus } from "@/lib/blog/repository";
import type { PostInput, PostStatus } from "@/lib/blog/types";

type Context = { params: Promise<{ id: string }> };

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const post = await getPostById((await params).id);
    return post ? NextResponse.json(post) : NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const previous = await getPostById(id);
    const post = await savePost({ ...(await request.json() as PostInput), id });
    revalidateBlog(previous?.slug);
    revalidateBlog(post?.slug);
    return NextResponse.json(post);
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const previous = await getPostById(id);
    const { status } = await request.json() as { status: PostStatus };
    if (!(["draft", "published", "scheduled"] as string[]).includes(status)) throw new Error("Status inválido.");
    const post = await setPostStatus(id, status);
    revalidateBlog(previous?.slug);
    revalidateBlog(post?.slug);
    return NextResponse.json(post);
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const post = await getPostById(id);
    await deletePost(id);
    revalidateBlog(post?.slug);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
