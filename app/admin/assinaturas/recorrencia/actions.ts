"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { listRegisteredEmailUsers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { asaasGet, type AsaasCustomer, type AsaasSubscription } from "@/lib/billing/asaas";

type Plan = "pro" | "agency";
type Cycle = "monthly" | "annual";
type SubscriptionAccess = { provider: string | null; status: string; current_period_end: string | null };
type PlanRow = { price_monthly_brl: number | string; price_annual_brl: number | string };
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function linkAsaasSubscription(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") || "").trim();
  const providerId = String(formData.get("providerSubscriptionId") || "").trim();
  const plan = String(formData.get("plan") || "") as Plan;
  const cycle = String(formData.get("cycle") || "") as Cycle;

  if (!UUID.test(userId) || !/^sub_[a-zA-Z0-9_-]{4,120}$/.test(providerId)
     || !["pro","agency"].includes(plan) || !["monthly","annual"].includes(cycle)) {
    throw Error("Dados inválidos para vincular a assinatura.");
  }

  const [users, subs, existing, priceRows, pending] = await Promise.all([
    listRegisteredEmailUsers(),
    asaasGet<AsaasSubscription>(`/subscriptions/${providerId}`),
    supabaseRest<SubscriptionAccess[]>(
      `user_subscriptions?select=provider,status,current_period_end&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=5`
    ),
    supabaseRest<PlanRow[]>(`subscription_plans?select=price_monthly_brl,price_annual_brl&code=eq.${plan}&active=eq.true&limit=1`),
    supabaseRest<Array<{ id: string }>>(
      `subscription_requests?select=id&user_id=eq.${encodeURIComponent(userId)}&status=in.(awaiting_payment,payment_reported)&limit=1`
    ),
  ]);

  const account = users.find(user => user.id === userId);
  if (!account?.email) throw Error("Conta de usuário não encontrada.");
  if (pending.length) throw Error("Existe pagamento pendente para este usuário. Concilie antes da vinculação.");
  if (existing.some(s => s.status === "active" && s.current_period_end && Date.parse(s.current_period_end) > Date.now())) {
    throw Error("Usuário já possui um plano ativo. Não vincule outra cobrança antes de encerrar o vínculo anterior.");
  }
  const expectedCycle = cycle === "annual" ? "YEARLY" : "MONTHLY";
  const expectedAmount = Number(cycle === "annual" ? priceRows[0]?.price_annual_brl : priceRows[0]?.price_monthly_brl);
  if (subs.id !== providerId || subs.status !== "ACTIVE" || subs.cycle !== expectedCycle
      || !Number.isFinite(expectedAmount) || Math.abs(Number(subs.value) - expectedAmount) > 0.001
      || subs.billingType !== "CREDIT_CARD") {
    throw Error("Os dados da assinatura não correspondem ao plano, valor ou periodicidade.");
  }

  const customer = await asaasGet<AsaasCustomer>(`/customers/${subs.customer}`);
  if (!customer.email || customer.email.trim().toLowerCase() !== account.email.trim().toLowerCase()) {
    throw Error("O e-mail do pagador Asaas não corresponde à conta Kivai. Vinculação bloqueada.");
  }

  await supabaseRest("kivai_recurring_provider_links", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      provider: "asaas",
      provider_subscription_id: providerId,
      provider_customer_id: customer.id,
      plan_code: plan,
      billing_cycle: cycle,
      expected_amount_brl: expectedAmount,
      state: "active",
    }),
  });
  // Vincular não significa que houve pagamento; somente webhook conciliado ativa acesso.
  revalidatePath("/admin/assinaturas/recorrencia");
  return { ok: true };
}
