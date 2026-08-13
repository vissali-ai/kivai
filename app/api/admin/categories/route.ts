import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { createCategory, listCategories } from "@/lib/blog/repository";

export async function GET() {
  try { await assertAdminApi(); return NextResponse.json(await listCategories()); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try { await assertAdminApi(); return NextResponse.json(await createCategory(await request.json()), { status: 201 }); }
  catch (error) { return apiError(error); }
}
