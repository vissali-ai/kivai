import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { deleteSiteService, getSiteServiceById, updateSiteService } from "@/lib/site-cms/service-repository";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { await assertAdminApi(); const item = await getSiteServiceById(decodeURIComponent((await params).id)); return item ? NextResponse.json(item) : NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 }); } catch (error) { return apiError(error); } }
export async function PUT(request: Request, { params }: Context) { try { await assertAdminApi(); const id = decodeURIComponent((await params).id); const previous = await getSiteServiceById(id); const item = await updateSiteService(id, await request.json()); if (previous) revalidatePath(previous.path); revalidatePath(item.path); revalidatePath("/servicos"); revalidatePath("/sitemap.xml"); return NextResponse.json(item); } catch (error) { return apiError(error); } }
export async function DELETE(_request: Request, { params }: Context) { try { await assertAdminApi(); const id = decodeURIComponent((await params).id); const previous = await getSiteServiceById(id); await deleteSiteService(id); if (previous) revalidatePath(previous.path); revalidatePath("/servicos"); revalidatePath("/sitemap.xml"); return new NextResponse(null, { status: 204 }); } catch (error) { return apiError(error); } }
