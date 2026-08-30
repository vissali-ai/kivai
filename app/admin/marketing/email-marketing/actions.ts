"use server";

import { listAdminCustomers } from "@/lib/admin/customer-users";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";

export type CampaignActionState = {
  ok: boolean;
  message: string;
  sent?: number;
  canceled?: number;
  failed?: number;
};

const MAX_RECIPIENTS_PER_SEND = 100;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function matchesAudience(user: Awaited<ReturnType<typeof listAdminCustomers>>[number], audience: string) {
  if (audience === "free") return user.planCode === "free";
  if (audience === "pro") return user.planCode === "pro";
  if (audience === "agency") return user.planCode === "agency";
  if (audience === "active") return user.subscriptionStatus === "active";
  if (audience === "trial") return user.testAccess || user.lifecycleStage === "trial";
  return true;
}

export async function sendCustomEmailCampaign(_previous: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  await assertAdminApi();

  const campaignName = clean(formData.get("campaignName"), 120);
  const audience = clean(formData.get("audience"), 30) || "all";
  const subject = clean(formData.get("subject"), 180);
  const preheader = clean(formData.get("preheader"), 220);
  const eyebrow = clean(formData.get("eyebrow"), 80);
  const headline = clean(formData.get("headline"), 180);
  const message = clean(formData.get("message"), 10000);
  const highlight = clean(formData.get("highlight"), 1200);
  const ctaLabel = clean(formData.get("ctaLabel"), 70);
  const ctaUrl = clean(formData.get("ctaUrl"), 800);
  const confirmed = formData.get("confirmSend") === "on";

  if (!campaignName || !subject || !headline || !message) {
    return { ok: false, message: "Preencha nome da campanha, assunto, título e conteúdo do e-mail." };
  }
  if (ctaLabel && !ctaUrl) return { ok: false, message: "Informe o link do botão principal." };
  if (ctaUrl && !/^https:\/\//i.test(ctaUrl)) return { ok: false, message: "O link do botão deve começar com https://." };
  if (!confirmed) return { ok: false, message: "Confirme explicitamente o envio antes de disparar a campanha." };

  const users = (await listAdminCustomers()).filter((user) => user.email && matchesAudience(user, audience));
  if (!users.length) return { ok: false, message: "Nenhum usuário foi encontrado para este público." };
  if (users.length > MAX_RECIPIENTS_PER_SEND) {
    return { ok: false, message: `Este disparo possui ${users.length} destinatários. O limite seguro atual é ${MAX_RECIPIENTS_PER_SEND} por envio. Segmente a campanha antes de continuar.` };
  }

  const campaignId = crypto.randomUUID();
  const now = new Date().toISOString();
  const rows = await supabaseRest<Array<{ id: string }>>("customer_communications", {
    method: "POST",
    body: JSON.stringify(users.map((user) => ({
      user_id: user.id,
      event_key: `custom_campaign_${campaignId}_${user.id}`,
      channel: "email",
      status: "ready",
      subject,
      message,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      scheduled_for: now,
      metadata: {
        source: "admin_manual",
        kind: "custom_email_campaign",
        layout: "kivai_campaign",
        campaign_id: campaignId,
        campaign_name: campaignName,
        audience,
        preheader,
        eyebrow,
        headline,
        highlight,
        recipient_email: user.email,
        recipient_name: user.fullName,
      },
    }))),
  });

  let sent = 0;
  let canceled = 0;
  let failed = 0;
  const queue = [...rows];
  const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      const result = await deliverCustomerEmail(item.id);
      if (result.status === "sent") sent += 1;
      else if (result.status === "canceled") canceled += 1;
      else if (result.status === "failed") failed += 1;
    }
  });
  await Promise.all(workers);

  await supabaseRest("customer_marketing_events", {
    method: "POST",
    body: JSON.stringify({
      user_id: users[0].id,
      event_type: "custom_campaign_completed",
      description: `Campanha manual ${campaignName} concluída: ${sent} enviados, ${canceled} cancelados e ${failed} com falha.`,
      metadata: { campaign_id: campaignId, campaign_name: campaignName, audience, recipients: users.length, sent, canceled, failed },
    }),
  });

  return {
    ok: failed === 0,
    message: `Campanha processada. ${sent} enviados, ${canceled} não enviados por preferência de marketing e ${failed} com falha.`,
    sent,
    canceled,
    failed,
  };
}
