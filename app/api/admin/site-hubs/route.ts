import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { createSiteHub, listSiteHubs } from "@/lib/site-cms/repository";

export async function GET() {
  try { await assertAdminApi(); return NextResponse.json(await listSiteHubs()); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const hub = await createSiteHub(await request.json());
    revalidatePath(hub.path);
    revalidatePath("/ferramentas");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(hub, { status: 201 });
  } catch (error) { return apiError(error); }
}
