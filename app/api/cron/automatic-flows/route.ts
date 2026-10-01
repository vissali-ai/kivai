import { NextResponse } from "next/server";
import { runCustomAutomationFlows } from "@/lib/marketing/automation-flows";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runCustomAutomationFlows());
  } catch (error) {
    console.error("custom_automation_flows_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Custom automation flows failed" }, { status: 500 });
  }
}
