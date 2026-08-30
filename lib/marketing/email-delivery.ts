import "server-only";

import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

const CUSTOMER_EMAIL_FROM = "Kivai <contato@kivai.com.br>";
const CUSTOMER_REPLY_TO = "contato@kivai.com.br";
const SITE_URL = "https://www.kivai.com.br";
const WHATSAPP_URL = "https://wa.me/5531996205058?text=Ol%C3%A1%21%20Recebi%20um%20e-mail%20do%20Kivai%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.";

type CommunicationRow = { id: string; user_id: string; channel: "email" | "whatsapp" | "internal"; status: string; subject: string | null; message: string; cta_label: string | null; cta_url: string | null; scheduled_for: string; metadata: Record<string, unknown> | null };
type EmailPreferenceRow = { user_id: string; marketing_opt_out: boolean; unsubscribe_token: string };
type AuthUser = { id: string; email?: string };
type DeliveryResult = { status: "sent"; providerId: string | null } | { status: "skipped" } | { status: "canceled"; reason: string } | { status: "failed"; error: string };

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function isMarketingCommunication(row: CommunicationRow) { const source = typeof row.metadata?.source === "string" ? row.metadata.source : ""; return source === "admin_suggestion" || source === "admin_manual" || typeof row.metadata?.flow_key === "string"; }
function metadataText(row: CommunicationRow, key: string) { return typeof row.metadata?.[key] === "string" ? String(row.metadata[key]).trim() : ""; }

function renderParagraphs(message: string, color = "#d8d9e3") {
  return message.split(/\n{2,}/).filter(Boolean).map((part) => `<p style="margin:0 0 18px;line-height:1.72;color:${color};font-size:16px">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`).join("");
}

function renderCampaignHtml(row: CommunicationRow, unsubscribeUrl: string | null) {
  const preheader = metadataText(row, "preheader");
  const eyebrow = metadataText(row, "eyebrow");
  const headline = metadataText(row, "headline") || row.subject || "Kivai";
  const highlight = metadataText(row, "highlight");
  const paragraphs = renderParagraphs(row.message);
  const primary = row.cta_label && row.cta_url ? `<a href="${escapeHtml(row.cta_url)}" style="display:inline-block;padding:14px 22px;background:#6d72ff;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px">${escapeHtml(row.cta_label)}</a>` : "";
  const highlightBlock = highlight ? `<div style="margin:24px 0;padding:18px 20px;border:1px solid #353a69;border-radius:12px;background:#15182a;color:#eef0ff;font-size:14px;line-height:1.65">${escapeHtml(highlight).replaceAll("\n", "<br>")}</div>` : "";
  const unsubscribe = unsubscribeUrl ? `<div style="margin-top:30px;padding-top:20px;border-top:1px solid #262936;font-size:12px;line-height:1.65;color:#8f92a3">Você recebeu este e-mail por ter cadastro ou relacionamento com o Kivai. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9aa0ff">Cancelar recebimento de e-mails de marketing</a>.</div>` : "";
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head><body style="margin:0;background:#090a10;font-family:Arial,Helvetica,sans-serif;color:#ffffff">${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : ""}<div style="max-width:680px;margin:0 auto;padding:34px 18px"><div style="padding:30px;border:1px solid #252836;border-radius:18px;background:#0f1119"><div style="display:inline-block;margin-bottom:26px;padding:8px 12px;border:1px solid #343861;border-radius:999px;color:#9ca1ff;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">KIVAI</div>${eyebrow ? `<div style="margin-bottom:12px;color:#7f86ff;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(eyebrow)}</div>` : ""}<h1 style="margin:0 0 20px;font-size:32px;line-height:1.12;color:#ffffff">${escapeHtml(headline)}</h1>${paragraphs}${highlightBlock}${primary ? `<div style="margin-top:26px">${primary}</div>` : ""}<div style="margin-top:28px;font-size:12px;line-height:1.65;color:#8f92a3">Ferramentas inteligentes para resultados reais.<br><a href="${SITE_URL}" style="color:#9aa0ff">kivai.com.br</a> · <a href="${WHATSAPP_URL}" style="color:#9aa0ff">WhatsApp</a></div>${unsubscribe}</div></div></body></html>`;
}

function renderHtml(row: CommunicationRow, unsubscribeUrl: string | null) {
  if (metadataText(row, "layout") === "kivai_campaign") return renderCampaignHtml(row, unsubscribeUrl);
  const paragraphs = row.message.split(/\n{2,}/).map((part) => `<p style="margin:0 0 16px;line-height:1.65;color:#252631">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`).join("");
  const primary = row.cta_label && row.cta_url ? `<a href="${escapeHtml(row.cta_url)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 18px;background:#5f5cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">${escapeHtml(row.cta_label)}</a>` : "";
  const whatsapp = `<a href="${WHATSAPP_URL}" style="display:inline-block;margin:0 0 8px;padding:12px 18px;background:#ffffff;color:#15151b;text-decoration:none;border:1px solid #d9dae2;border-radius:8px;font-weight:700">Entrar em contato pelo WhatsApp</a>`;
  const unsubscribe = unsubscribeUrl ? `<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e3e4ea;font-size:12px;line-height:1.6;color:#737586">Você está recebendo esta mensagem porque possui relacionamento com o Kivai. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5f5cff">Não quero receber mais e-mails de marketing</a>.</div>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#15151b"><div style="max-width:620px;margin:0 auto;padding:32px 20px"><div style="padding:28px;border:1px solid #e2e3e9;border-radius:16px;background:#ffffff"><div style="font-size:22px;font-weight:800;margin-bottom:8px">Kivai</div><div style="font-size:12px;color:#77798a;margin-bottom:24px">Ferramentas inteligentes para resultados reais.</div>${paragraphs}<div style="margin:24px 0 4px">${primary}${whatsapp}</div>${unsubscribe}</div></div></body></html>`;
}

async function getAuthEmail(userId: string) {
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { cache: "no-store", headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${blogConfig.serviceRoleKey}` } });
  if (!response.ok) return null;
  const user = await response.json() as AuthUser;
  return user.email?.trim().toLowerCase() || null;
}

async function getOrCreateEmailPreference(userId: string) {
  const existing = await supabaseRest<EmailPreferenceRow[]>(`customer_email_preferences?select=user_id,marketing_opt_out,unsubscribe_token&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  if (existing[0]) return existing[0];
  const created = await supabaseRest<EmailPreferenceRow[]>("customer_email_preferences", { method: "POST", body: JSON.stringify({ user_id: userId }) });
  return created[0] ?? null;
}

async function markFailed(id: string, message: string) { await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(id)}&status=eq.queued`, { method: "PATCH", body: JSON.stringify({ status: "failed", provider_status: "failed", error: message.slice(0, 1000), updated_at: new Date().toISOString() }) }); }
async function markCanceled(id: string, reason: string) { await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(id)}&status=eq.queued`, { method: "PATCH", body: JSON.stringify({ status: "canceled", provider_status: "canceled", error: reason.slice(0, 1000), updated_at: new Date().toISOString() }) }); }

export async function sendAdminCampaignTestEmail(input: {
  recipient: string;
  subject: string;
  message: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  preheader?: string;
  eyebrow?: string;
  headline?: string;
  highlight?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY não configurada." } as const;
  const recipient = input.recipient.trim().toLowerCase();
  if (!recipient) return { ok: false, error: "E-mail do administrador não configurado." } as const;

  const row: CommunicationRow = {
    id: "admin-campaign-test",
    user_id: "admin",
    channel: "email",
    status: "ready",
    subject: input.subject,
    message: input.message,
    cta_label: input.ctaLabel ?? null,
    cta_url: input.ctaUrl ?? null,
    scheduled_for: new Date().toISOString(),
    metadata: {
      layout: "kivai_campaign",
      preheader: input.preheader ?? "",
      eyebrow: input.eyebrow ?? "",
      headline: input.headline ?? "",
      highlight: input.highlight ?? "",
    },
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CUSTOMER_EMAIL_FROM,
        to: [recipient],
        reply_to: CUSTOMER_REPLY_TO,
        subject: `[TESTE] ${input.subject}`,
        text: `[TESTE DE CAMPANHA KIVAI]\n\n${input.message}`,
        html: renderCampaignHtml(row, null),
        tags: [{ name: "category", value: "campaign_test" }],
      }),
    });
    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok) return { ok: false, error: payload.message || payload.name || `Resend recusou o teste (${response.status}).` } as const;
    return { ok: true, providerId: payload.id ?? null } as const;
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Falha inesperada ao enviar o teste." } as const;
  }
}

export async function deliverCustomerEmail(communicationId: string): Promise<DeliveryResult> {
  const claimed = await supabaseRest<CommunicationRow[]>(`customer_communications?id=eq.${encodeURIComponent(communicationId)}&status=eq.ready&channel=eq.email`, { method: "PATCH", body: JSON.stringify({ status: "queued", provider_status: "processing", error: null, updated_at: new Date().toISOString() }) });
  const row = claimed[0];
  if (!row) return { status: "skipped" };

  const marketing = isMarketingCommunication(row);
  const preference = marketing ? await getOrCreateEmailPreference(row.user_id) : null;
  if (marketing && preference?.marketing_opt_out) { const reason = "Usuário optou por não receber e-mails de marketing."; await markCanceled(row.id, reason); return { status: "canceled", reason }; }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { const error = "RESEND_API_KEY não configurada."; await markFailed(row.id, error); return { status: "failed", error }; }
  const metadataEmail = typeof row.metadata?.recipient_email === "string" ? row.metadata.recipient_email.trim().toLowerCase() : "";
  const recipient = metadataEmail || await getAuthEmail(row.user_id);
  if (!recipient) { const error = "E-mail do destinatário não encontrado."; await markFailed(row.id, error); return { status: "failed", error }; }

  const unsubscribeUrl = marketing && preference ? `${SITE_URL}/email/preferencias?token=${encodeURIComponent(preference.unsubscribe_token)}` : null;
  const category = typeof row.metadata?.kind === "string" ? row.metadata.kind : marketing ? "marketing" : "transactional";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CUSTOMER_EMAIL_FROM,
        to: [recipient],
        reply_to: CUSTOMER_REPLY_TO,
        subject: row.subject || "Kivai",
        text: `${row.message}\n\nFale com o Kivai no WhatsApp: ${WHATSAPP_URL}${unsubscribeUrl ? `\n\nNão quer mais receber e-mails de marketing? ${unsubscribeUrl}` : ""}`,
        html: renderHtml(row, unsubscribeUrl),
        tags: [{ name: "category", value: category.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) }],
        ...(unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      }),
    });

    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok) { const error = payload.message || payload.name || `Resend recusou o envio (${response.status}).`; await markFailed(row.id, error); return { status: "failed", error }; }

    const sentAt = new Date().toISOString();
    await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(row.id)}&status=eq.queued`, { method: "PATCH", body: JSON.stringify({ status: "sent", provider_status: "accepted", sent_at: sentAt, error: null, updated_at: sentAt, metadata: { ...(row.metadata ?? {}), recipient_email: recipient, delivery_provider: "resend", resend_email_id: payload.id ?? null, sender: CUSTOMER_EMAIL_FROM, reply_to: CUSTOMER_REPLY_TO } }) });
    return { status: "sent", providerId: payload.id ?? null };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Falha inesperada no envio pelo Resend.";
    await markFailed(row.id, error);
    return { status: "failed", error };
  }
}

export async function deliverPendingAccountWelcome(userId: string) {
  const rows = await supabaseRest<Array<{ id: string }>>(`customer_communications?select=id&user_id=eq.${encodeURIComponent(userId)}&channel=eq.email&status=eq.ready&event_key=like.account_welcome_*&order=created_at.asc&limit=1`);
  if (!rows[0]) return { status: "skipped" } as const;
  return deliverCustomerEmail(rows[0].id);
}
