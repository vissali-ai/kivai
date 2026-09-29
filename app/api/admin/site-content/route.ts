import { revalidateSiteCms } from "@/lib/site-cms/revalidation";
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
    revalidateSiteCms();
    return NextResponse.json(item, { status: 201 });
  } catch (error) { return apiError(error); }
}
