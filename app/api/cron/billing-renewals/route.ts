import { NextResponse } from "next/server";
import { runDueSubscriptionRenewals } from "@/lib/billing/sumup";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await runDueSubscriptionRenewals());
  } catch (error) {
    const message = error instanceof Error ? error.message : "renewal_failed";
    console.error("billing_renewal_cron_failed", message);
    return NextResponse.json({ error: "Billing renewal failed" }, { status: 500 });
  }
}
