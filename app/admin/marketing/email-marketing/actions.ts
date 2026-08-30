"use server";

import sanitizeHtml from "sanitize-html";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { assertAdminApi } from "@/lib/blog/auth";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail, sendAdminCampaignTestEmail } from "@/lib/marketing/email-delivery";

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

function sanitizeCampaignMessage(value: FormDataEntryValue | null) {
  return sanitizeHtml(String(value ?? "").slice(0, 30000), {
    allowedTags: ["p", "br", "strong", "em", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "hr", "img"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: "a", attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" } }),
    },
  }).trim();
}

function hasCampaignContent(html: string) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
  return Boolean(text || /<img\b/i.test(html) || /<hr\b/i.test(html));
}

function matchesAudience(user: Awaited<ReturnType<typeof listAdminCustomers>>[number], audience: string) {
  if (audience === "free") return user.planCode === "free";
  if (audience === "pro") return user.planCode === "pro";
  if (audience === "agency") return user.planCode === "agency";
  if (audience === "active") return user.subscriptionStatus === "active";
  if (audience === "trial") return user.testAccess || user.lifecycleStage === "trial";
  return true;
}

function readCampaignFields(formData: FormData) {
  return {
    campaignName: clean(formData.get("campaignName"), 120),
    audience: clean(formData.get("audience"), 30) || "all",
    subject: clean(formData.get("subject"), 180),
    preheader: clean(formData.get("preheader"), 220),
    eyebrow: clean(formData.get("eyebrow"), 80),
    headline: clean(formData.get("headline"), 180),
    message: sanitizeCampaignMessage(formData.get("message")),
    highlight: clean(formData.get("highlight"), 1200),
    ctaLabel: clean(formData.get("ctaLabel"), 70),
    ctaUrl: clean(formData.get("ctaUrl"), 800),
    secondaryCtaLabel: clean(formData.get("secondaryCtaLabel"), 70),
    secondaryCtaUrl: clean(formData.get("secondaryCtaUrl"), 800),
  };
}

function validateCampaign(fields: ReturnType<typeof readCampaignFields>, requireName = true) {
  if ((requireName && !fields.campaignName) || !fields.subject || !fields.headline || !hasCampaignContent(fields.message)) {
    return requireName
      ? "Preencha nome da campanha, assunto, título e conteúdo do e-mail."
      : "Preencha assunto, título e conteúdo do e-mail antes de enviar o teste.";
  }
  if (fields.ctaLabel && !fields.ctaUrl) return "Informe o link do botão principal.";
  if (fields.ctaUrl && !/^https:\/\//i.test(fields.ctaUrl)) return "O link do botão principal deve começar com https://.";
  if (fields.secondaryCtaLabel && !fields.secondaryCtaUrl) return "Informe o link do segundo botão.";
  if (fields.secondaryCtaUrl && !fields.secondaryCtaLabel) return "Informe o texto do segundo botão ou remova o link.";
  if (fields.secondaryCtaUrl && !/^https:\/\//i.test(fields.secondaryCtaUrl)) return "O link do segundo botão deve começar com https://.";
  return null;
}

export async function sendCustomEmailTest(_previous: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  await assertAdminApi();
  const fields = readCampaignFields(formData);
  const validation = validateCampaign(fields, false);
  if (validation) return { ok: false, message: validation };

  const recipient = blogConfig.adminEmail?.trim().toLowerCase() ?? "";
  if (!recipient) return { ok: false, message: "O e-mail do administrador não está configurado." };

  const result = await sendAdminCampaignTestEmail({
    recipient,
    subject: fields.subject,
    message: fields.message,
    ctaLabel: fields.ctaLabel || null,
    ctaUrl: fields.ctaUrl || null,
    secondaryCtaLabel: fields.secondaryCtaLabel || null,
    secondaryCtaUrl: fields.secondaryCtaUrl || null,
    preheader: fields.preheader,
    eyebrow: fields.eyebrow,
    headline: fields.headline,
    highlight: fields.highlight,
  });

  if (!result.ok) return { ok: false, message: `Não foi possível enviar o teste: ${result.error}` };
  return { ok: true, message: `E-mail de teste enviado para ${recipient}. Confira a caixa de entrada antes do disparo geral.` };
}

export async function sendCustomEmailCampaign(_previous: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  await assertAdminApi();

  const fields = readCampaignFields(formData);
  const validation = validateCampaign(fields, true);
  if (validation) return { ok: false, message: validation };
  const confirmed = formData.get("confirmSend") === "on";
  if (!confirmed) return { ok: false, message: "Confirme explicitamente o envio antes de disparar a campanha." };

  const users = (await listAdminCustomers()).filter((user) => user.email && matchesAudience(user, fields.audience));
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
      subject: fields.subject,
      message: fields.message,
      cta_label: fields.ctaLabel || null,
      cta_url: fields.ctaUrl || null,
      scheduled_for: now,
      metadata: {
        source: "admin_manual",
        kind: "custom_email_campaign",
        layout: "kivai_campaign",
        message_format: "rich_html",
        campaign_id: campaignId,
        campaign_name: fields.campaignName,
        audience: fields.audience,
        preheader: fields.preheader,
        eyebrow: fields.eyebrow,
        headline: fields.headline,
        highlight: fields.highlight,
        secondary_cta_label: fields.secondaryCtaLabel,
        secondary_cta_url: fields.secondaryCtaUrl,
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
      description: `Campanha manual ${fields.campaignName} concluída: ${sent} enviados, ${canceled} cancelados e ${failed} com falha.`,
      metadata: { campaign_id: campaignId, campaign_name: fields.campaignName, audience: fields.audience, recipients: users.length, sent, canceled, failed },
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
