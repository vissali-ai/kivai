import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

/**
 * Bônus promocional de 30 créditos isolado do saldo mensal/pago existente.
 * Uma análise bem-sucedida com Gemini custa 1 crédito beta.
 * Quando não for possível processar a análise, a reserva é devolvida.
 */
export const TRAFFIC_BETA_CREDITS_INITIAL = 30;
export const TRAFFIC_BETA_ANALYSIS_COST = 1;

export type TrafficBetaBalance = {
  eligible: boolean;
  initial: number;
  remaining: number;
  activated?: boolean;
};

export async function trafficBetaBalance(userId: string): Promise<TrafficBetaBalance> {
  await supabaseRest<number>("rpc/recover_stale_traffic_beta_operations", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId }),
  });
  return supabaseRest<TrafficBetaBalance>("rpc/get_traffic_beta_balance", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId }),
  });
}

export async function reserveTrafficBetaCredit(userId: string, operationId: string): Promise<{
  allowed: boolean; remaining?: number; reason?: string; status?: string;
}> {
  return supabaseRest("rpc/reserve_traffic_beta_credit", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId, p_operation_id: operationId }),
  });
}

export async function finalizeTrafficBetaCredit(
  userId: string,
  operationId: string,
  success: boolean,
): Promise<boolean> {
  return supabaseRest<boolean>("rpc/finalize_traffic_beta_credit", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId, p_operation_id: operationId, p_success: success }),
  });
}
