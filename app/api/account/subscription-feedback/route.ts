import { authenticateBillingUser } from "@/lib/billing/sumup";
import { supabaseRest } from "@/lib/blog/supabase";
import { isSubscriptionFeedbackReason, subscriptionFeedbackReasons } from "@/lib/billing/subscription-feedback";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
type Subscription = { plan_code: "pro" | "agency"; status: string; test_access: boolean };
type PriorFeedback = { created_at: string };
const COOL_DOWN_DAYS = 14;

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return Response.json({ error: "Entre na sua conta para enviar a resposta." }, { status: 401, headers }); }

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 1400) {
      return Response.json({ error: "Resposta muito longa." }, { status: 413, headers });
    }

    let input: unknown;
    try { input = JSON.parse(text); }
    catch { return Response.json({ error: "Resposta inválida." }, { status: 400, headers }); }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return Response.json({ error: "Resposta inválida." }, { status: 400, headers });
    }

    const body = input as Record<string, unknown>;
    if (!isSubscriptionFeedbackReason(body.reason) || (body.comment !== undefined && typeof body.comment !== "string")) {
      return Response.json({ error: "Selecione um motivo válido." }, { status: 400, headers });
    }
    const comment = (typeof body.comment === "string" ? body.comment : "").trim();
    if (comment.length > 500) return Response.json({ error: "O comentário deve ter até 500 caracteres." }, { status: 400, headers });

    const subscriptions = await supabaseRest<Subscription[]>(
      `user_subscriptions?select=plan_code,status,test_access&user_id=eq.${encodeURIComponent(userId)}&plan_code=in.(pro,agency)&order=updated_at.desc&limit=10`
    );
    // Evita enquete de cancelamento para visitantes sem qualquer histórico pago ou de teste.
    if (!subscriptions.length) {
      return Response.json({ error: "Esta pesquisa é destinada a usuários que utilizaram Pro ou Agency." }, { status: 403, headers });
    }

    const since = new Date(Date.now() - COOL_DOWN_DAYS * 86400000).toISOString();
    const recent = await supabaseRest<PriorFeedback[]>(
      `customer_marketing_events?select=created_at&user_id=eq.${encodeURIComponent(userId)}&event_type=eq.subscription_feedback&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1`
    );
    if (recent.length) {
      return Response.json({ error: "Sua resposta já foi recebida recentemente. Obrigado pelo feedback." }, { status: 429, headers });
    }

    const subscription = subscriptions[0];
    await supabaseRest("customer_marketing_events", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        event_type: "subscription_feedback",
        description: subscriptionFeedbackReasons[body.reason],
        metadata: {
          reason: body.reason,
          comment,
          plan_code: subscription.plan_code,
          subscription_status_at_feedback: subscription.status,
          test_access: subscription.test_access,
          source: "account_retention",
        },
      }),
    });
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ error: "Não foi possível registrar sua resposta agora." }, { status: 503, headers });
  }
}
