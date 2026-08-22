import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { deleteSiteContent, getSiteContentById, updateSiteContent } from "@/lib/site-cms/repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try { await assertAdminApi(); const item = await getSiteContentById(decodeURIComponent((await params).id)); return item ? NextResponse.json(item) : NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 }); }
  catch (error) { return apiError(error); }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = decodeURIComponent((await params).id);
    const previous = await getSiteContentById(id);
    const item = await updateSiteContent(id, await request.json());
    if (previous) revalidatePath(previous.path);
    revalidatePath(item.path);
    revalidatePath("/ferramentas");
    revalidatePath("/");
    revalidatePath("/ajuda");
    revalidatePath("/recursos");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(item);
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = decodeURIComponent((await params).id);
    const previous = await getSiteContentById(id);
    await deleteSiteContent(id);
    if (previous) revalidatePath(previous.path);
    revalidatePath("/");
    revalidatePath("/ajuda");
    revalidatePath("/recursos");
    revalidatePath("/sitemap.xml");
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
