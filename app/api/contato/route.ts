import { NextResponse } from "next/server";

const SUBJECTS = new Set(["Problema técnico", "Sugerir ferramenta", "Dúvidas"]);
const KIVAI_EMAIL = "contato@kivai.com.br";
const KIVAI_FROM = `Kivai <${KIVAI_EMAIL}>`;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_BODY_BYTES = 8_000;

type RateEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateEntry>();

function normalize(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength + 1);
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = rateLimitStore.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Requisição inválida." }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.includes("application/json") || declaredSize > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 413 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const website = normalize(payload.website, 200);
    if (website) return NextResponse.json({ ok: true });

    const name = normalize(payload.name, 100);
    const email = normalize(payload.email, 254).toLowerCase();
    const subject = normalize(payload.subject, 50);
    const message = normalize(payload.message, 3000);

    if (!name || name.length > 100 || !isValidEmail(email) || !SUBJECTS.has(subject) || message.length < 20 || message.length > 3000) {
      return NextResponse.json({ error: "Verifique os dados informados." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[contact] Email service is not configured.");
      return NextResponse.json({ error: "Não foi possível enviar a mensagem." }, { status: 503 });
    }

    const sentAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date());
    const emailBody = [`Nome:\n${name}`, `E-mail:\n${email}`, `Assunto:\n${subject}`, `Mensagem:\n${message}`, `Data e hora:\n${sentAt}`].join("\n\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: KIVAI_FROM,
        to: [KIVAI_EMAIL],
        reply_to: email,
        subject: `[Kivai Contato] ${subject}`,
        text: emailBody,
      }),
    });

    if (!resendResponse.ok) {
      console.error("[contact] Email provider rejected the request.", { status: resendResponse.status });
      return NextResponse.json({ error: "Não foi possível enviar a mensagem." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] Unexpected contact form error.", { cause: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "Não foi possível enviar a mensagem." }, { status: 500 });
  }
}
