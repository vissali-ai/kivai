import { authenticateBillingUser } from "@/lib/billing/sumup";
import { supabaseRest } from "@/lib/blog/supabase";
import { defaultReminder, validReminderTimezone, type ReminderPreference } from "@/lib/account/routine-reminder-options";
import { getVapidPublicKey, isPushConfigured, validPushEndpoint } from "@/lib/pwa/web-push";
import { getToolBySlug } from "@/lib/tools";

export const runtime = "nodejs";

type ReminderRow = ReminderPreference & { user_id: string; last_sent_local_date: string | null };
type SubscriptionInput = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
const headers = { "Cache-Control": "private, no-store" };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });

export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const rows = await supabaseRest<ReminderRow[]>(`user_routine_reminders?select=enabled,weekday,hour,time_zone,tool_slug&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    return Response.json({ preference: rows[0] ?? defaultReminder, vapidPublicKey: isPushConfigured() && process.env.REMINDER_SCHEDULER_ENABLED === "true" ? getVapidPublicKey() : "" }, { headers });
  } catch (cause) {
    return error(cause instanceof Error && cause.message === "UNAUTHORIZED" ? "Faça login para continuar." : "Não foi possível carregar seus lembretes.", cause instanceof Error && cause.message === "UNAUTHORIZED" ? 401 : 503);
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) return error("Configuração inválida.", 400);
    if (body.action === "disable") {
      await supabaseRest(`user_routine_reminders?on_conflict=user_id`, {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: user.id, enabled: false }),
      });
      await supabaseRest(`user_routine_push_subscriptions?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
      return Response.json({ enabled: false }, { headers });
    }
    if (body.action !== "save" || !isPushConfigured() || process.env.REMINDER_SCHEDULER_ENABLED !== "true") return error("Notificações indisponíveis no momento.", 503);
    const weekday = body.weekday, hour = body.hour, zone = body.time_zone, slug = body.tool_slug;
    const subscription = body.subscription as SubscriptionInput | undefined;
    if (typeof weekday !== "number" || !Number.isInteger(weekday) || weekday < 0 || weekday > 6 ||
        typeof hour !== "number" || !Number.isInteger(hour) || hour < 8 || hour > 21 ||
        typeof zone !== "string" || !validReminderTimezone(zone) ||
        typeof slug !== "string" || !getToolBySlug(slug)?.available ||
        !subscription || typeof subscription.endpoint !== "string" || !validPushEndpoint(subscription.endpoint) ||
        typeof subscription.keys?.p256dh !== "string" || typeof subscription.keys.auth !== "string" ||
        Buffer.from(subscription.keys.p256dh, "base64url").length !== 65 ||
        Buffer.from(subscription.keys.auth, "base64url").length !== 16) return error("Verifique os dados da rotina e a autorização do navegador.", 400);

    const collision = await supabaseRest<Array<{ user_id: string }>>(
      `user_routine_push_subscriptions?select=user_id&endpoint=eq.${encodeURIComponent(subscription.endpoint)}&limit=1`,
    );
    if (collision.length && collision[0].user_id !== user.id) return error("Este dispositivo já está vinculado a outra conta. Desative os lembretes na outra conta primeiro.", 409);

    await supabaseRest("user_routine_push_subscriptions?on_conflict=endpoint", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: user.id, endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh, auth_key: subscription.keys.auth,
      }),
    });
    await supabaseRest("user_routine_reminders?on_conflict=user_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: user.id, enabled: true, weekday, hour,
        time_zone: zone, tool_slug: slug, updated_at: new Date().toISOString(),
      }),
    });
    return Response.json({ enabled: true }, { headers });
  } catch (cause) {
    return error(cause instanceof Error && cause.message === "UNAUTHORIZED" ? "Faça login para continuar." : "Não foi possível salvar a rotina. Tente novamente.", cause instanceof Error && cause.message === "UNAUTHORIZED" ? 401 : 503);
  }
}
