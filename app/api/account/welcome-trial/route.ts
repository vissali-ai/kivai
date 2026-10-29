import { authenticateBillingUser } from "@/lib/billing/sumup";
import { supabaseRest } from "@/lib/blog/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
type Status = { status: "eligible" | "used" | "has_plan" | "verify_email" | "unavailable" | "activated"; expiresAt?: string };
const headers = { "Cache-Control": "private, no-store" };

async function run(request: Request, redeem: boolean) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(request); }
  catch { return NextResponse.json({ status: "unauthorized" }, { status: 401, headers }); }
  try {
    const result = await supabaseRest<Status>("rpc/kivai_welcome_trial", {
      method: "POST",
      body: JSON.stringify({ p_user_id: user.id, p_redeem: redeem }),
    });
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error("welcome_trial_error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers });
  }
}

export async function GET(request: Request) { return run(request, false); }
export async function POST(request: Request) { return run(request, true); }
