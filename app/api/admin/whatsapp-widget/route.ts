import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import {
  getWhatsappSupportConfig,
  InvalidWhatsappConfig,
  saveWhatsappSupportConfig,
} from "@/lib/site-support/whatsapp";

export async function GET() {
  try {
    await assertAdminApi();
    return NextResponse.json(await getWhatsappSupportConfig(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertAdminApi();
    const input = await request.json().catch(() => null);
    return NextResponse.json(await saveWhatsappSupportConfig(input), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof InvalidWhatsappConfig) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
}
