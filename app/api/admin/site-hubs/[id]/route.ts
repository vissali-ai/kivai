import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { deleteSiteHub, listSiteHubs, updateSiteHub } from "@/lib/site-cms/repository";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const previous = (await listSiteHubs()).find((item) => item.id === id);
    const hub = await updateSiteHub(id, await request.json());
    if (previous) revalidatePath(previous.path);
    revalidatePath(hub.path);
    revalidatePath("/ferramentas");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(hub);
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const previous = (await listSiteHubs()).find((item) => item.id === id);
    await deleteSiteHub(id);
    if (previous) revalidatePath(previous.path);
    revalidatePath("/sitemap.xml");
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
