import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { createEditorialTopic, listEditorialTopics } from "@/lib/news-agent/editorial-topics";
export async function GET() {
  try { await assertAdminApi(); return NextResponse.json(await listEditorialTopics()); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try { await assertAdminApi(); return NextResponse.json(await createEditorialTopic(await request.json()), {status: 201}); }
  catch (error) { return apiError(error); }
}
