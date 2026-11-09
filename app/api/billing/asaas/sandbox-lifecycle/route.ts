import "server-only";
import { timingSafeEqual } from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";

type AsaasSubscription = {
  id: string;
  customer: string;
  status: string;
  value: number;
  cycle: string;
  externalReference?: string | null;
};
const ID = /^[a-zA-Z0-9_-]{4,120}$/;
const EVENT = /^.{5,160}$/;
const noStore = { "Cache-Control": "no-store" };

function reply(code: number, message: string) {
  return Response.json({ message }, { status: code, headers: noStore });
}
function enabled() {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.ASAAS_ENVIRONMENT === "sandbox" &&
    process.env.KIVAI_ASAAS_LIFECYCLE_SYNC === "true" &&
    (process.env.ASAAS_SANDBOX_API_KEY ?? "").length >= 20 &&
    (process.env.ASAAS_SANDBOX_WEBHOOK_TOKEN ?? "").length >= 32;
}
function validToken(received: string | null) {
  const expected = process.env.ASAAS_SANDBOX_WEBHOOK_TOKEN ?? "";
  if (!received || !expected) return false;
  const a = Buffer.from(expected), b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function verifySubscription(id: string) {
  if (!ID.test(id)) throw Error("INVALID_SUBSCRIPTION_ID");
  const response = await fetch(`https://api-sandbox.asaas.com/v3/subscriptions/${id}`, {
    headers: {
      access_token: process.env.ASAAS_SANDBOX_API_KEY ?? "",
      accept: "application/json",
      "User-Agent": "Kivai/1.0 (sandbox-lifecycle)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw Error(`SUBSCRIPTION_VERIFICATION_${response.status}`);
  const record = await response.json() as AsaasSubscription;
  if (record.id !== id || record.status !== "ACTIVE" ||
    typeof record.customer !== "string" || !ID.test(record.customer) ||
    !Number.isFinite(record.value) || record.value <= 0 ||
    !["MONTHLY","YEARLY"].includes(record.cycle)) throw Error("INVALID_VERIFIED_SUBSCRIPTION");
  return record;
}
export async function POST(request: Request) {
  // This endpoint is for sandbox audit only; never grants paid access.
  if (!enabled()) return reply(503,"Sincronização de testes indisponível.");
  if (!validToken(request.headers.get("asaas-access-token"))) return reply(401,"Não autorizado.");
  if (Number(request.headers.get("content-length") || 0) > 12000) return reply(413,"Evento muito grande.");
  const raw = await request.text();
  if (Buffer.byteLength(raw,"utf8") > 12000) return reply(413,"Evento muito grande.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return reply(400,"Evento inválido."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return reply(400,"Evento inválido.");
  const data = value as Record<string,unknown>;
  const eventId = typeof data.id === "string" ? data.id : "";
  const type = typeof data.event === "string" ? data.event : "";
  if (!EVENT.test(eventId)) return reply(400,"Identificação inválida.");

  if (["CHECKOUT_PAID","CHECKOUT_CANCELED","CHECKOUT_EXPIRED"].includes(type)) {
    const checkout = data.checkout && typeof data.checkout === "object" && !Array.isArray(data.checkout)
      ? data.checkout as Record<string,unknown> : {};
    const checkoutId = typeof checkout.id === "string" ? checkout.id : "";
    const expectedStatus = type === "CHECKOUT_PAID" ? "PAID" :
      type === "CHECKOUT_CANCELED" ? "CANCELED" : "EXPIRED";
    if (!ID.test(checkoutId) || checkout.status !== expectedStatus) {
      return reply(400,"Checkout inválido.");
    }
    try {
      const result = await supabaseRest<{ recorded:boolean; linked?:boolean }>(
        "rpc/kivai_record_asaas_checkout_lifecycle",{
          method:"POST",body:JSON.stringify({
            p_event_id:eventId,p_checkout_id:checkoutId,p_event_type:type,
          }),
        });
      return reply(200,result.linked ? "Evento registrado." : "Evento encaminhado à conferência.");
    } catch {
      console.error("asaas_checkout_lifecycle_persist_failed");
      return reply(503,"Falha ao registrar evento.");
    }
  }
  if (type === "SUBSCRIPTION_CREATED") {
    const subscription = data.subscription && typeof data.subscription === "object" && !Array.isArray(data.subscription)
      ? data.subscription as Record<string,unknown> : {};
    const id = typeof subscription.id === "string" ? subscription.id : "";
    if (!ID.test(id)) return reply(400,"Assinatura inválida.");
    try {
      const verified = await verifySubscription(id);
      // Sem externalReference não é possível ligar com segurança ao usuário.
      // Não associar pela coincidência de preço, e-mail ou momento da compra.
      if (!verified.externalReference || !/^kivai_asaas_[0-9a-f-]{36}$/.test(verified.externalReference)) {
        return reply(202,"Assinatura sem referência verificável. Conciliação manual necessária.");
      }
      const result = await supabaseRest<{ recorded:boolean; linked?:boolean }>(
        "rpc/kivai_record_asaas_subscription_candidate",{
          method:"POST",body:JSON.stringify({
            p_event_id:eventId,p_subscription_id:verified.id,
            p_external_reference:verified.externalReference,
            p_customer_id:verified.customer,
            p_amount_brl:verified.value,p_cycle:verified.cycle,
          }),
        });
      return reply(200,result.linked ? "Assinatura associada para conferência." : "Conciliação manual necessária.");
    } catch {
      console.error("asaas_subscription_lifecycle_verification_failed");
      return reply(503,"Não foi possível verificar a assinatura.");
    }
  }
  return reply(200,"Evento fora do escopo de testes.");
}
