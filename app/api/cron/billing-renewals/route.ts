import { NextResponse } from "next/server";
import { expireDueExternalSubscriptions } from "@/lib/billing/manual-subscriptions";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await expireDueExternalSubscriptions());
  } catch (error) {
    const message = error instanceof Error ? error.message : "subscription_expiry_failed";
    console.error("subscription_expiry_cron_failed", message);
    return NextResponse.json({ error: "Subscription expiry check failed" }, { status: 500 });
  }
}
