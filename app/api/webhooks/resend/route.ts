import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
  if (!secret || !verifySvix(body, request.headers, secret)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body) as { type?: string; created_at?: string; data?: { email_id?: string; bounce?: { message?: string } } };
  const emailId = event.data?.email_id;
  if (!emailId || !event.type?.startsWith("email.")) return NextResponse.json({ ok: true });

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
    await supabaseRest(filter, { method: "PATCH", body: JSON.stringify({ provider_status: "sent", updated_at: now }) });
  }
  return NextResponse.json({ ok: true });
}
