import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import { AI_CREDIT_PACKS, type AiCreditPackCode, aiCreditSalesEnabled } from "@/lib/ai/packs";

type HostedCheckout = {
  id: string;
  checkout_reference: string;
  hosted_checkout_url?: string;
  amount?: number;
  currency?: string;
  status?: string;
  transactions?: Array<{ status?: string }>;
};
type Order = {
  id: string; user_id: string; checkout_id: string; checkout_reference: string;
  amount_cents: number; pack_code: AiCreditPackCode; credits: number; status: "pending" | "paid" | "cancelled";
};

function isConfigured() {
  return Boolean(process.env.SUMUP_API_KEY && process.env.SUMUP_MERCHANT_CODE);
}
async function sumup<T>(path: string, init: RequestInit = {}) {
  if (!isConfigured()) throw new Error("PAYMENT_UNAVAILABLE");
  const response = await fetch(`https://api.sumup.com/v0.1${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    console.warn("[kivai-credit] Provider HTTP", response.status);
    throw new Error("PAYMENT_PROVIDER_ERROR");
  }
  return await response.json() as T;
}
export async function createCreditCheckout(userId: string, packCode: AiCreditPackCode) {
  if (!aiCreditSalesEnabled()) throw new Error("CREDIT_SALES_DISABLED");
  const pack = AI_CREDIT_PACKS[packCode];
  const id = crypto.randomUUID();
  const reference = `kivai-ai-${id}`;
  const origin = process.env.VERCEL_ENV === "production"
    ? "https://www.kivai.com.br"
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const checkout = await sumup<HostedCheckout>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      checkout_reference: reference,
      amount: pack.cents / 100,
      currency: "BRL",
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description: `Kivai IA - ${pack.credits} créditos`,
      redirect_url: `${origin}/creditos/retorno?order=${id}`,
      hosted_checkout: { enabled: true },
    }),
  });
  if (!checkout.id || checkout.checkout_reference !== reference ||
      !checkout.hosted_checkout_url ||
      !/^https:\/\/checkout\.sumup\.com\//.test(checkout.hosted_checkout_url)) {
    throw new Error("PAYMENT_INVALID_HOSTED_CHECKOUT");
  }
  await supabaseRest<Order[]>("ai_credit_orders", {
    method: "POST",
    body: JSON.stringify({
      id, user_id: userId, pack_code: packCode,
      credits: pack.credits, amount_cents: pack.cents,
      checkout_id: checkout.id, checkout_reference: reference, status: "pending",
    }),
  });
  return { orderId: id, checkoutUrl: checkout.hosted_checkout_url };
}

export async function confirmCreditCheckout(userId: string, orderId: string) {
  const orders = await supabaseRest<Order[]>(
    `ai_credit_orders?select=id,user_id,checkout_id,checkout_reference,amount_cents,pack_code,credits,status&id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  );
  const order = orders[0];
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "paid") return { paid: true, credits: order.credits };
  if (order.status !== "pending") throw new Error("ORDER_NOT_PENDING");
  const checkout = await sumup<HostedCheckout>(`/checkouts/${encodeURIComponent(order.checkout_id)}`);
  const paid = checkout.status === "PAID" ||
    checkout.transactions?.some(transaction => transaction.status === "SUCCESSFUL");
  if (!paid) return { paid: false, status: checkout.status ?? "PENDING" };
  if (checkout.id !== order.checkout_id ||
      checkout.checkout_reference !== order.checkout_reference ||
      checkout.currency !== "BRL" ||
      Math.round((checkout.amount ?? -1) * 100) !== order.amount_cents) {
    throw new Error("PAYMENT_VERIFICATION_FAILED");
  }
  const result = await supabaseRest<{ granted: boolean; credits?: number }>("rpc/grant_ai_credit_order", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId, p_order_id: order.id,
      p_checkout_id: checkout.id, p_checkout_reference: checkout.checkout_reference,
      p_amount_cents: order.amount_cents, p_currency: checkout.currency,
    }),
  });
  if (!result.granted) throw new Error("CREDIT_GRANT_FAILED");
  return { paid: true, credits: result.credits ?? order.credits };
}
