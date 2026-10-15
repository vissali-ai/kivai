import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import { AI_CREDIT_PACKS, type AiCreditPackCode, aiCreditSalesEnabled } from "@/lib/ai/packs";

const API = "https://api.checkout.infinitepay.io";

type CheckoutLink = { url?: string };
type PaymentCheck = { success?: boolean; paid?: boolean; amount?: number; paid_amount?: number; capture_method?: string };
type Order = {
  id: string;
  user_id: string;
  checkout_id: string;
  checkout_reference: string;
  amount_cents: number;
  pack_code: AiCreditPackCode;
  credits: number;
  status: "pending" | "paid" | "cancelled";
  transaction_nsu?: string | null;
};

function handle() {
  // Never infer a merchant's receiving account from a different project.
  const value = (process.env.INFINITEPAY_HANDLE || "").trim().replace(/^\$/, "");
  if (!/^[a-zA-Z0-9_-]{3,80}$/.test(value)) throw new Error("INFINITEPAY_NOT_CONFIGURED");
  return value;
}

async function postInfinitePay<T>(path: "/links" | "/payment_check", payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: handle(), ...payload }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    console.warn("[kivai-credit] InfinitePay returned HTTP", response.status);
    throw new Error("INFINITEPAY_REQUEST_FAILED");
  }
  return await response.json() as T;
}

function trustedCheckoutLink(url: string) {
  const candidate = new URL(url);
  const safeHosts = ["checkout.infinitepay.com.br", "checkout.infinitepay.io", "buy.infinitepay.io"];
  if (candidate.protocol !== "https:" || !safeHosts.includes(candidate.hostname) ||
      candidate.username || candidate.password) {
    throw new Error("INFINITEPAY_INVALID_CHECKOUT_URL");
  }
  return candidate.toString();
}

export async function createCreditCheckout(userId: string, packCode: AiCreditPackCode) {
  if (!aiCreditSalesEnabled()) throw new Error("CREDIT_SALES_DISABLED");
  const pack = AI_CREDIT_PACKS[packCode];
  const id = crypto.randomUUID();
  const reference = `kivai-ai-${id}`;
  const origin = process.env.VERCEL_ENV === "production"
    ? "https://www.kivai.com.br"
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  // Store the order before creating the external link so an early webhook can find it.
  await supabaseRest<Order[]>("ai_credit_orders", {
    method: "POST",
    body: JSON.stringify({
      id, user_id: userId, pack_code: packCode,
      credits: pack.credits, amount_cents: pack.cents,
      checkout_id: id, checkout_reference: reference, status: "pending",
    }),
  });

  const checkout = await postInfinitePay<CheckoutLink>("/links", {
    order_nsu: reference,
    items: [{ quantity: 1, price: pack.cents, description: `Kivai - ${pack.credits} créditos de IA` }],
    redirect_url: `${origin}/creditos/retorno?order=${encodeURIComponent(id)}`,
    webhook_url: `${origin}/api/ai/credits/infinitepay/webhook`,
  });
  if (!checkout.url) throw new Error("INFINITEPAY_MISSING_CHECKOUT_URL");
  const checkoutUrl = trustedCheckoutLink(checkout.url);
  await supabaseRest<Order[]>(`ai_credit_orders?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ checkout_url: checkoutUrl }),
  });
  return { orderId: id, checkoutUrl };
}

async function findOrderForUser(userId: string, orderId: string) {
  const rows = await supabaseRest<Order[]>(
    `ai_credit_orders?select=id,user_id,checkout_id,checkout_reference,amount_cents,pack_code,credits,status,transaction_nsu&id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  );
  return rows[0];
}

async function confirmOrderWithProvider(order: Order, transactionNsu: string, slug: string) {
  // Untrusted browser redirects/webhooks cannot credit the wallet.
  // The tuple must independently verify as paid on the official provider endpoint.
  if (!transactionNsu || transactionNsu.length < 8 || transactionNsu.length > 150 ||
      !slug || slug.length < 2 || slug.length > 150) {
    return { paid: false, status: "AWAITING_PAYMENT_REFERENCE" };
  }
  const checked = await postInfinitePay<PaymentCheck>("/payment_check", {
    order_nsu: order.checkout_reference,
    transaction_nsu: transactionNsu,
    slug,
  });
  if (checked.success !== true || checked.paid !== true) {
    return { paid: false, status: "PENDING" };
  }
  if (!Number.isSafeInteger(checked.amount) || checked.amount !== order.amount_cents) {
    throw new Error("INFINITEPAY_AMOUNT_MISMATCH");
  }
  const result = await supabaseRest<{ granted: boolean; credits?: number }>(
    "rpc/grant_ai_credit_order", {
      method: "POST",
      body: JSON.stringify({
        p_user_id: order.user_id,
        p_order_id: order.id,
        p_checkout_id: order.checkout_id,
        p_checkout_reference: order.checkout_reference,
        p_amount_cents: order.amount_cents,
        p_currency: "BRL",
        p_transaction_nsu: transactionNsu,
        p_invoice_slug: slug,
      }),
    },
  );
  if (!result.granted) throw new Error("CREDIT_GRANT_FAILED");
  return { paid: true, credits: result.credits ?? order.credits };
}

export async function confirmCreditCheckout(
  userId: string, orderId: string, transactionNsu: string, slug: string,
) {
  const order = await findOrderForUser(userId, orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "paid") return { paid: true, credits: order.credits };
  if (order.status !== "pending") throw new Error("ORDER_NOT_PENDING");
  return confirmOrderWithProvider(order, transactionNsu, slug);
}

export async function confirmCreditWebhook(
  reference: string, transactionNsu: string, slug: string,
) {
  if (!/^kivai-ai-[a-f0-9-]{36}$/i.test(reference)) throw new Error("INVALID_ORDER_REFERENCE");
  const rows = await supabaseRest<Order[]>(
    `ai_credit_orders?select=id,user_id,checkout_id,checkout_reference,amount_cents,pack_code,credits,status,transaction_nsu&checkout_reference=eq.${encodeURIComponent(reference)}&limit=1`,
  );
  const order = rows[0];
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status === "paid") {
    if (order.transaction_nsu !== transactionNsu) throw new Error("TRANSACTION_CONFLICT");
    return { paid: true, credits: order.credits };
  }
  return confirmOrderWithProvider(order, transactionNsu, slug);
}
