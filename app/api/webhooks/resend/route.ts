import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";

function verifySvix(body: string, headers: Headers, secret: string) {
  const id = headers.get("svix-id") ?? "";
  const timestamp = headers.get("svix-timestamp") ?? "";
  const signatureHeader = headers.get("svix-signature") ?? "";
  if (!id || !timestamp || !signatureHeader || !secret.startsWith("whsec_")) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = Buffer.from(secret.slice(6), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return signatureHeader.split(" ").some((part) => {
    const value = part.startsWith("v1,") ? part.slice(3) : "";
    if (!value) return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(value);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

function parseAddress(value: string) {
  const match = value.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].replace(/^["']|["']$/g, "").trim() || null, email: match[2].trim().toLowerCase() };
  return { name: null, email: value.trim().toLowerCase() };
}

function headerValue(headers: Record<string, string> | undefined, name: string) {
  if (!headers) return "";
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return entry?.[1]?.trim() ?? "";
}

async function storeReceivedEmail(emailId: string, fallback: { created_at?: string; from?: string; to?: string[]; subject?: string; message_id?: string; attachments?: Array<Record<string, unknown>> }) {
  const sender = parseAddress(fallback.from || "");
  if (!sender.email) return;

  const users = await listAdminCustomers().catch(() => []);
  const user = users.find((item) => item.email.trim().toLowerCase() === sender.email);

  // Persist the webhook payload first so a received email always appears in the admin inbox,
  // even if the follow-up API request for the full body is unavailable.
  await supabaseRest("customer_inbox_messages?on_conflict=resend_email_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      resend_email_id: emailId,
      user_id: user?.id ?? null,
      communication_id: null,
      from_email: sender.email,
      from_name: sender.name,
      to_emails: fallback.to ?? [],
      subject: fallback.subject ?? "",
      text_body: "",
      html_body: "",
      message_id: fallback.message_id ?? null,
      in_reply_to: null,
      references_header: null,
      attachments: fallback.attachments ?? [],
      received_at: fallback.created_at ?? new Date().toISOString(),
      is_read: false,
    }),
  });

  const apiKeys = Array.from(
    new Set(
      [process.env.RESEND_INBOUND_API_KEY, process.env.RESEND_API_KEY]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
  if (!apiKeys.length) {
    console.warn("[resend webhook] Received email stored without body: API key unavailable.", { emailId });
    return;
  }

  let response: Response | null = null;
  for (const apiKey of apiKeys) {
    const candidate = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (candidate.ok) {
      response = candidate;
      break;
    }
    console.warn("[resend webhook] Received email detail fetch attempt failed.", {
      emailId,
      status: candidate.status,
    });
  }

  if (!response) {
    console.warn("[resend webhook] Received email stored without body: all detail fetch attempts failed.", { emailId });
    return;
  }

  const received = await response.json() as {
    id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    text?: string | null;
    html?: string | null;
    message_id?: string | null;
    headers?: Record<string, string>;
    attachments?: Array<Record<string, unknown>>;
    created_at?: string;
  };

  const fullSender = parseAddress(received.from || fallback.from || "");
  const inReplyTo = headerValue(received.headers, "in-reply-to");
  const references = headerValue(received.headers, "references");

  let communicationId: string | null = null;
  if (inReplyTo) {
    const linked = await supabaseRest<Array<{ id: string }>>(
      `customer_communications?select=id&metadata->>message_id=eq.${encodeURIComponent(inReplyTo)}&order=created_at.desc&limit=1`
    ).catch(() => []);
    communicationId = linked[0]?.id ?? null;
  }

  await supabaseRest(`customer_inbox_messages?resend_email_id=eq.${encodeURIComponent(emailId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      communication_id: communicationId,
      from_email: fullSender.email || sender.email,
      from_name: fullSender.name || sender.name,
      to_emails: received.to ?? fallback.to ?? [],
      subject: received.subject ?? fallback.subject ?? "",
      text_body: received.text ?? "",
      html_body: received.html ?? "",
      message_id: received.message_id ?? fallback.message_id ?? null,
      in_reply_to: inReplyTo || null,
      references_header: references || null,
      attachments: received.attachments ?? fallback.attachments ?? [],
      received_at: received.created_at ?? fallback.created_at ?? new Date().toISOString(),
    }),
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
  if (!secret || !verifySvix(body, request.headers, secret)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body) as {
    type?: string;
    created_at?: string;
    data?: {
      email_id?: string;
      message_id?: string;
      from?: string;
      to?: string[];
      subject?: string;
      attachments?: Array<Record<string, unknown>>;
      bounce?: { message?: string };
    };
  };
  const emailId = event.data?.email_id;
  if (!emailId || !event.type?.startsWith("email.")) return NextResponse.json({ ok: true });

  if (event.type === "email.received") {
    await storeReceivedEmail(emailId, {
      created_at: event.created_at,
      from: event.data?.from,
      to: event.data?.to,
      subject: event.data?.subject,
      message_id: event.data?.message_id,
      attachments: event.data?.attachments ?? [],
    });
    return NextResponse.json({ ok: true });
  }

  const now = event.created_at || new Date().toISOString();
  const filter = `customer_communications?metadata->>resend_email_id=eq.${encodeURIComponent(emailId)}`;
  if (event.type === "email.delivered") {
    await supabaseRest(filter, { method: "PATCH", body: JSON.stringify({ provider_status: "delivered", delivered_at: now, updated_at: now }) });
  } else if (event.type === "email.bounced") {
    await supabaseRest(filter, { method: "PATCH", body: JSON.stringify({ status: "failed", provider_status: "bounced", bounced_at: now, error: event.data?.bounce?.message || "E-mail devolvido pelo provedor do destinatário.", updated_at: now }) });
  } else if (event.type === "email.complained") {
    await supabaseRest(filter, { method: "PATCH", body: JSON.stringify({ provider_status: "complained", complained_at: now, error: "Destinatário registrou reclamação de spam.", updated_at: now }) });
  } else if (event.type === "email.failed") {
    await supabaseRest(filter, { method: "PATCH", body: JSON.stringify({ status: "failed", provider_status: "failed", updated_at: now }) });
  } else if (event.type === "email.sent") {
    const rows = await supabaseRest<Array<{ id: string; metadata: Record<string, unknown> | null }>>(`${filter}&select=id,metadata&limit=1`).catch(() => []);
    const row = rows[0];
    if (row) {
      await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          provider_status: "sent",
          updated_at: now,
          metadata: { ...(row.metadata ?? {}), message_id: event.data?.message_id ?? null },
        }),
      });
    }
  }
  return NextResponse.json({ ok: true });
}
