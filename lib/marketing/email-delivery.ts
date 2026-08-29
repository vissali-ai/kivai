import "server-only";

import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

const CUSTOMER_EMAIL_FROM = "Kivai <contato@kivai.com.br>";

type CommunicationRow = {
  id: string;
  user_id: string;
  channel: "email" | "whatsapp" | "internal";
  status: string;
  subject: string | null;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  scheduled_for: string;
  metadata: Record<string, unknown> | null;
};

type AuthUser = { id: string; email?: string };

type DeliveryResult =
  | { status: "sent"; providerId: string | null }
  | { status: "skipped" }
  | { status: "failed"; error: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHtml(row: CommunicationRow) {
  const paragraphs = row.message
    .split(/\n{2,}/)
    .map((part) => `<p style="margin:0 0 16px;line-height:1.65;color:#d8d8df">${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const cta = row.cta_label && row.cta_url
    ? `<p style="margin:24px 0"><a href="${escapeHtml(row.cta_url)}" style="display:inline-block;padding:12px 18px;background:#6d6cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">${escapeHtml(row.cta_label)}</a></p>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#090a0f;font-family:Arial,sans-serif;color:#fff"><div style="max-width:620px;margin:0 auto;padding:32px 20px"><div style="padding:24px;border:1px solid #242631;border-radius:16px;background:#111219"><div style="font-size:22px;font-weight:800;margin-bottom:24px">Kivai</div>${paragraphs}${cta}<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#8f92a3">Ferramentas inteligentes para resultados reais.</p></div></div></body></html>`;
}

async function getAuthEmail(userId: string) {
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    cache: "no-store",
    headers: {
      apikey: blogConfig.serviceRoleKey,
      Authorization: `Bearer ${blogConfig.serviceRoleKey}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json() as AuthUser;
  return user.email?.trim().toLowerCase() || null;
}

async function markFailed(id: string, message: string) {
  await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(id)}&status=eq.queued`, {
    method: "PATCH",
    body: JSON.stringify({ status: "failed", error: message.slice(0, 1000), updated_at: new Date().toISOString() }),
  });
}

export async function deliverCustomerEmail(communicationId: string): Promise<DeliveryResult> {
  const claimed = await supabaseRest<CommunicationRow[]>(`customer_communications?id=eq.${encodeURIComponent(communicationId)}&status=eq.ready&channel=eq.email`, {
    method: "PATCH",
    body: JSON.stringify({ status: "queued", error: null, updated_at: new Date().toISOString() }),
  });
  const row = claimed[0];
  if (!row) return { status: "skipped" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = "RESEND_API_KEY não configurada.";
    await markFailed(row.id, error);
    return { status: "failed", error };
  }

  const metadataEmail = typeof row.metadata?.recipient_email === "string" ? row.metadata.recipient_email.trim().toLowerCase() : "";
  const recipient = metadataEmail || await getAuthEmail(row.user_id);
  if (!recipient) {
    const error = "E-mail do destinatário não encontrado.";
    await markFailed(row.id, error);
    return { status: "failed", error };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CUSTOMER_EMAIL_FROM,
        to: [recipient],
        subject: row.subject || "Kivai",
        text: row.message,
        html: renderHtml(row),
      }),
    });

    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok) {
      const error = payload.message || payload.name || `Resend recusou o envio (${response.status}).`;
      await markFailed(row.id, error);
      return { status: "failed", error };
    }

    const sentAt = new Date().toISOString();
    await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(row.id)}&status=eq.queued`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "sent",
        sent_at: sentAt,
        error: null,
        updated_at: sentAt,
        metadata: { ...(row.metadata ?? {}), recipient_email: recipient, delivery_provider: "resend", resend_email_id: payload.id ?? null, sender: CUSTOMER_EMAIL_FROM },
      }),
    });
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
