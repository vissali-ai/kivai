import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { newsAgentConfig } from "@/lib/blog/config";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (newsAgentConfig.cronSecret.length < 32 || !safeEqual(supplied, newsAgentConfig.cronSecret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  // Desativa apenas a importação antiga de pautas. O radar público continua usando suas fontes.
  return NextResponse.json({
    error: "Coleta RSS desativada no Admin. A pesquisa Gemini é executada manualmente.",
  }, { status: 410 });
}
