import { NextResponse } from "next/server";
import { getWhatsappSupportConfig } from "@/lib/site-support/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getWhatsappSupportConfig(), {
      headers: { "Cache-Control": "public, no-store" },
    });
  } catch (error) {
    console.error("whatsapp_support_config_read_failed", error);
    return NextResponse.json({ enabled: false }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
