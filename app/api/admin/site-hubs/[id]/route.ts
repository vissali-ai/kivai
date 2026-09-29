import { revalidateSiteCms } from "@/lib/site-cms/revalidation";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { deleteSiteHub, updateSiteHub } from "@/lib/site-cms/repository";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    const hub = await updateSiteHub(id, await request.json());
    revalidateSiteCms();
    return NextResponse.json(hub);
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    await deleteSiteHub(id);
    revalidateSiteCms();
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
