import "server-only";

import { finalizeAiCredits, getAiCreditBalance, reserveAiCredits } from "@/lib/ai/credits";

/** Compatibility adapter: traffic analysis uses the shared AI credit wallet. */
export const TRAFFIC_BETA_CREDITS_INITIAL = 5;
export const TRAFFIC_BETA_ANALYSIS_COST = 1;

export type TrafficBetaBalance = { eligible: boolean; initial: number; remaining: number; activated?: boolean };

export async function trafficBetaBalance(userId: string): Promise<TrafficBetaBalance> {
  const balance = await getAiCreditBalance(userId);
  return { eligible: true, initial: TRAFFIC_BETA_CREDITS_INITIAL, remaining: balance.total_remaining, activated: true };
}

export async function reserveTrafficBetaCredit(userId: string, operationId: string): Promise<{
  allowed: boolean; remaining?: number; reason?: string; status?: string;
}> {
  const result = await reserveAiCredits({ userId, operationId, kind: "insight", cost: 1 });
  return { allowed: result.allowed === true, remaining: result.purchased_remaining, reason: result.reason, status: result.status };
}

export async function finalizeTrafficBetaCredit(userId: string, operationId: string, success: boolean): Promise<boolean> {
  return finalizeAiCredits(userId, operationId, success);
}
