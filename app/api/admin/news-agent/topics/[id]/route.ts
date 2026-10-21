import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { deleteEditorialTopic, updateEditorialTopic } from "@/lib/news-agent/editorial-topics";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, {params}: Context) {
  try { await assertAdminApi(); return NextResponse.json(await updateEditorialTopic((await params).id, await request.json())); }
  catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, {params}: Context) {
  try { await assertAdminApi(); await deleteEditorialTopic((await params).id); return new NextResponse(null, {status: 204}); }
  catch (error) { return apiError(error); }
}
