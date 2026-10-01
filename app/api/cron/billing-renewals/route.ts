import { retryActivationEmails } from "@/lib/billing/activation-emails";
import { NextResponse } from "next/server";
import { expireDueExternalSubscriptions, sendProTestExpiryEmails } from "@/lib/billing/manual-subscriptions";
import { cleanupExpiredCommunicationLogs } from "@/lib/marketing/communication-retention";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const proTestExpiryEmails = await sendProTestExpiryEmails();
    const [subscriptions, communicationLogs, activationEmails] = await Promise.all([
      expireDueExternalSubscriptions(),
      cleanupExpiredCommunicationLogs(),
      retryActivationEmails(),
    ]);

    return NextResponse.json({ subscriptions, communicationLogs, activationEmails, proTestExpiryEmails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "scheduled_maintenance_failed";
    console.error("scheduled_maintenance_cron_failed", message);
    return NextResponse.json({ error: "Scheduled maintenance failed" }, { status: 500 });
  }
}
