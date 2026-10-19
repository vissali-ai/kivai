import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

export const FREE_AI_CREDITS_MONTHLY = 10;

export type AiCreditBalance = {
  plan_code: "free" | "pro" | "agency";
  free_limit: number;
  free_remaining: number;
  purchased_remaining: number;
  total_remaining: number;
  renews_on: string;
};

type ReservationResult = {
  allowed: boolean;
  status?: string;
  reason?: string;
  free_remaining?: number;
  purchased_remaining?: number;
};

async function recoverInterruptedRequests(userId: string) {
  await supabaseRest<number>("rpc/recover_stale_ai_credit_operations", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId }),
  });
}

export async function getAiCreditBalance(userId: string): Promise<AiCreditBalance> {
  await recoverInterruptedRequests(userId);
  return supabaseRest<AiCreditBalance>("rpc/get_ai_credit_balance", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId }),
  });
}

export async function reserveAiCredits(input: {
  userId: string; operationId: string; kind: "insight" | "import"; cost: 1 | 2 | 5;
}) {
  return supabaseRest<ReservationResult>("rpc/reserve_ai_credits", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: input.userId,
      p_operation_id: input.operationId,
      p_operation_kind: input.kind,
      p_cost: input.cost,
    }),
  });
}

export async function finalizeAiCredits(userId: string, operationId: string, success: boolean) {
  return supabaseRest<boolean>("rpc/finalize_ai_credits", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_operation_id: operationId,
      p_success: success,
    }),
  });
}
