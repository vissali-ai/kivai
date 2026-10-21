import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";

export async function POST() {
  try {
    await assertAdminApi();
    return NextResponse.json({
      error: "A coleta por RSS do painel foi substituída. Use /admin/blog/agente para pesquisar com Gemini.",
    }, { status: 410 });
  } catch (error) { return apiError(error); }
}
