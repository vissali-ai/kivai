import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { scanProjectMaintenance } from "@/lib/project-maintenance";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    await assertAdminApi();
    return NextResponse.json(scanProjectMaintenance(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
