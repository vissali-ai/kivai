import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { runNewsAgent } from "@/lib/news-agent/service";

export const maxDuration = 300;

export async function POST() {
  try {
    await assertAdminApi();
    return NextResponse.json(await runNewsAgent());
  } catch (error) {
    return apiError(error);
  }
}
