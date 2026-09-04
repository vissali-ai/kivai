import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseRest } from "@/lib/blog/supabase";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120), company: z.string().trim().min(2).max(160), email: z.string().trim().email().max(180), phone: z.string().trim().min(8).max(40),
  segment: z.string().trim().max(120).optional().default(""), city: z.string().trim().max(100).optional().default(""), state: z.string().trim().max(2).optional().default(""),
  website: z.string().trim().max(300).optional().default(""), instagram: z.string().trim().max(300).optional().default(""),
  has_domain: z.string().max(10).optional().default(""), has_website: z.string().max(10).optional().default(""), has_landing_page: z.string().max(10).optional().default(""), has_google_ads: z.string().max(10).optional().default(""), has_google_business: z.string().max(10).optional().default(""), has_analytics: z.string().max(10).optional().default(""), has_tag_manager: z.string().max(10).optional().default(""), has_search_console: z.string().max(10).optional().default(""), has_social_media: z.string().max(10).optional().default(""),
  social_networks: z.array(z.string().max(40)).max(10).optional().default([]), objective: z.string().trim().max(160).optional().default(""), currently_advertising: z.string().trim().max(160).optional().default(""), monthly_budget: z.string().trim().max(80).optional().default(""), message: z.string().trim().max(1200).optional().default(""), website_url: z.string().trim().max(300).optional().default(""),
  honeypot: z.string().max(200).optional().default(""), privacy_consent: z.boolean().refine(Boolean, "Consentimento obrigatório"),
  utm_source: z.string().trim().max(120).optional().default(""), utm_medium: z.string().trim().max(120).optional().default(""), utm_campaign: z.string().trim().max(160).optional().default(""), utm_term: z.string().trim().max(160).optional().default(""), utm_content: z.string().trim().max(160).optional().default(""), landing_page: z.string().trim().max(300).optional().default("/"), referrer: z.string().trim().max(500).optional().default(""),
});

type RateEntry = { count: number; resetAt: number };
const rate = new Map<string, RateEntry>();

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function cleanText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);
  const now = Date.now();
  const current = rate.get(key);
  if (current && current.resetAt > now && current.count >= 5) return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  if (!current || current.resetAt <= now) rate.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
  else current.count += 1;

  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Revise os campos obrigatórios e tente novamente." }, { status: 400 });
    if (parsed.data.honeypot) return NextResponse.json({ ok: true });

    const lead = parsed.data;
    const row = {
      name: cleanText(lead.name), company: cleanText(lead.company), email: lead.email.toLowerCase(), phone: cleanText(lead.phone), segment: cleanText(lead.segment), city: cleanText(lead.city), state: cleanText(lead.state).toUpperCase(), website: cleanText(lead.website), instagram: cleanText(lead.instagram),
      has_domain: lead.has_domain, has_website: lead.has_website, has_landing_page: lead.has_landing_page, has_google_ads: lead.has_google_ads, has_google_business: lead.has_google_business, has_analytics: lead.has_analytics, has_tag_manager: lead.has_tag_manager, has_search_console: lead.has_search_console, has_social_media: lead.has_social_media, social_networks: lead.social_networks,
      objective: cleanText(lead.objective), currently_advertising: cleanText(lead.currently_advertising), monthly_budget: cleanText(lead.monthly_budget), message: cleanText(lead.message), privacy_consent: true, privacy_consent_at: new Date().toISOString(), status: "new",
      utm_source: cleanText(lead.utm_source), utm_medium: cleanText(lead.utm_medium), utm_campaign: cleanText(lead.utm_campaign), utm_term: cleanText(lead.utm_term), utm_content: cleanText(lead.utm_content), landing_page: cleanText(lead.landing_page), referrer: cleanText(lead.referrer),
    };
    await supabaseRest("trafego_leads", { method: "POST", body: JSON.stringify(row) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar sua solicitação agora." }, { status: 500 });
  }
}
