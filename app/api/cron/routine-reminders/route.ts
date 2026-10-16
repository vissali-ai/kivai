import { supabaseRest } from "@/lib/blog/supabase";
import { dueReminderAt, type ReminderPreference } from "@/lib/account/routine-reminder-options";
import { getToolBySlug } from "@/lib/tools";
import { isPushConfigured, sendRoutinePush, type PushSubscriptionRecord } from "@/lib/pwa/web-push";

export const runtime = "nodejs";
export const maxDuration = 60;

type ReminderRow = ReminderPreference & { user_id: string; last_sent_local_date: string | null };

export async function POST(request: Request) {
  const secret = process.env.REMINDER_CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPushConfigured()) return Response.json({ error: "Web Push is not configured" }, { status: 503 });
  const now = new Date();
  let sent = 0, due = 0, expired = 0, failed = 0;
  try {
    const preferences = await supabaseRest<ReminderRow[]>(
      "user_routine_reminders?select=user_id,enabled,weekday,hour,time_zone,tool_slug,last_sent_local_date&enabled=eq.true&limit=500",
    );
    for (const item of preferences) {
      const localDate = dueReminderAt(item, now);
      if (!localDate || item.last_sent_local_date === localDate) continue;
      const tool = getToolBySlug(item.tool_slug);
      if (!tool?.available) continue;
      const subscriptions = await supabaseRest<PushSubscriptionRecord[]>(
        `user_routine_push_subscriptions?select=user_id,endpoint,p256dh,auth_key&user_id=eq.${encodeURIComponent(item.user_id)}&limit=8`,
      );
      if (!subscriptions.length) continue;
      due += 1;
      // Reserva idempotente: somente o primeiro processamento deste dia pode disparar.
      const claimed = await supabaseRest<ReminderRow[]>(
        `user_routine_reminders?user_id=eq.${encodeURIComponent(item.user_id)}&or=(last_sent_local_date.is.null,last_sent_local_date.neq.${localDate})`,
        { method: "PATCH", body: JSON.stringify({ last_sent_local_date: localDate }) },
      );
      if (!claimed.length) continue;
      for (const subscription of subscriptions) {
        try {
          const status = await sendRoutinePush(subscription, {
            title: "Sua rotina no Kivai",
            body: `Reserve alguns minutos para usar ${tool.name} e continuar sua rotina.`,
            url: `/ferramentas/${tool.slug}`,
          });
          if (status === 404 || status === 410) {
            expired += 1;
            await supabaseRest(`user_routine_push_subscriptions?user_id=eq.${encodeURIComponent(item.user_id)}&endpoint=eq.${encodeURIComponent(subscription.endpoint)}`, { method: "DELETE" });
          } else if (status >= 200 && status < 300) sent += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
    }
    return Response.json({ ok: true, due, sent, expired, failed });
  } catch (cause) {
    console.error("routine_reminders_cron_failed", cause instanceof Error ? cause.message : "UNKNOWN");
    return Response.json({ error: "Unable to dispatch routine reminders" }, { status: 500 });
  }
}
