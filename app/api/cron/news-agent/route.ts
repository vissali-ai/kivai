import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { newsAgentConfig } from "@/lib/blog/config";
import { runNewsAgent } from "@/lib/news-agent/service";

export const maxDuration = 300;

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
  try {
    return NextResponse.json(await runNewsAgent());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao executar o agente." },
      { status: 500 },
    );
  }
}
