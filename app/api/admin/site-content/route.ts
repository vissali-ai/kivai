import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { createSiteContent, listManagedSiteContents } from "@/lib/site-cms/repository";

export async function GET() {
  try { await assertAdminApi(); return NextResponse.json(await listManagedSiteContents()); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const item = await createSiteContent(await request.json());
    revalidatePath(item.path);
    revalidatePath("/ferramentas");
    revalidatePath("/");
    revalidatePath("/ajuda");
    revalidatePath("/recursos");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(item, { status: 201 });
  } catch (error) { return apiError(error); }
}
