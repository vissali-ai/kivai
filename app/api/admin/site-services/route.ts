import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { createSiteService, listManagedSiteServices } from "@/lib/site-cms/service-repository";

export async function GET() { try { await assertAdminApi(); return NextResponse.json(await listManagedSiteServices()); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { await assertAdminApi(); const item = await createSiteService(await request.json()); revalidatePath("/servicos"); revalidatePath(item.path); revalidatePath("/sitemap.xml"); return NextResponse.json(item, { status: 201 }); } catch (error) { return apiError(error); } }
