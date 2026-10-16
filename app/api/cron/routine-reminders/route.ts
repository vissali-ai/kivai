import { supabaseRest } from "@/lib/blog/supabase";
import { blogConfig } from "@/lib/blog/config";
import { sendKivaiEmail } from "@/lib/email/resend";
import { dueReminderAt, type ReminderPreference } from "@/lib/account/routine-reminder-options";
import { getToolBySlug } from "@/lib/tools";
import { isPushConfigured, sendRoutinePush, type PushSubscriptionRecord } from "@/lib/pwa/web-push";

export const runtime = "nodejs";
export const maxDuration = 60;

type ReminderRow = ReminderPreference & { user_id: string; last_sent_local_date: string | null; email_reminder_consent_at: string | null };

export async function POST(request: Request) {
  const secret = process.env.REMINDER_CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPushConfigured() && !process.env.RESEND_API_KEY) return Response.json({ error: "No reminder delivery channel configured" }, { status: 503 });
  const now = new Date();
  let sent = 0, due = 0, expired = 0, failed = 0;
  try {
    const preferences = await supabaseRest<ReminderRow[]>(
      "user_routine_reminders?select=user_id,enabled,weekday,hour,time_zone,tool_slug,delivery_channel,email_reminder_consent_at,last_sent_local_date&enabled=eq.true&limit=500",
    );
    for (const item of preferences) {
      const localDate = dueReminderAt(item, now);
      if (!localDate || item.last_sent_local_date === localDate) continue;
      const tool = getToolBySlug(item.tool_slug);
      if (!tool?.available) continue;
      const channel = item.delivery_channel || "browser";
      if (channel === "email" && (!process.env.RESEND_API_KEY || !item.email_reminder_consent_at)) continue;
      if (channel === "browser" && !isPushConfigured()) continue;
      const subscriptions = channel === "browser" ? await supabaseRest<PushSubscriptionRecord[]>(
        `user_routine_push_subscriptions?select=user_id,endpoint,p256dh,auth_key&user_id=eq.${encodeURIComponent(item.user_id)}&limit=8`,
      ) : [];
      if (channel === "browser" && !subscriptions.length) continue;
      due += 1;
      // Reserva idempotente: somente o primeiro processamento deste dia pode disparar.
      const claimed = await supabaseRest<ReminderRow[]>(
        `user_routine_reminders?user_id=eq.${encodeURIComponent(item.user_id)}&or=(last_sent_local_date.is.null,last_sent_local_date.neq.${localDate})`,
        { method: "PATCH", body: JSON.stringify({ last_sent_local_date: localDate }) },
      );
      if (!claimed.length) continue;
      if (channel === "email") {
        try {
          const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(item.user_id)}`, {
            headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${blogConfig.serviceRoleKey}` },
            cache: "no-store", signal: AbortSignal.timeout(9000),
          });
          if (!response.ok) throw Error("Reminder recipient unavailable");
          const user = await response.json() as { email?: string };
          const recipient = user.email?.trim();
          if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw Error("No valid email on account");
          await sendKivaiEmail({
            to: recipient,
            subject: `Seu lembrete semanal: ${tool.name} | Kivai`,
            text: `Olá!\n\nEste é o seu lembrete semanal, solicitado no Kivai.\n\nSua atividade: ${tool.name}.\nAcesse: https://www.kivai.com.br/ferramentas/${tool.slug}\n\nPara alterar ou desativar esses lembretes, entre em https://www.kivai.com.br/conta e procure Lembretes da rotina.\n\nEquipe Kivai`,
          });
          sent += 1;
        } catch {
          failed += 1;
          console.error("[kivai-reminders] E-mail delivery failed");
        }
        continue;
      }
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
