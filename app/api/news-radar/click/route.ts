import { NextResponse } from "next/server";
import { newsRadarConfig } from "@/lib/news-radar/config";
import {
  consumeRadarRateLimit,
  incrementRadarMetric,
  incrementRadarSourceClick,
  listRadarSources,
} from "@/lib/news-radar/repository";
import { radarRequestIdentifier } from "@/lib/news-radar/request";
import { isNewsRadarCategory } from "@/lib/news-radar/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { category?: unknown; sourceName?: unknown };
    if (!isNewsRadarCategory(body.category) || typeof body.sourceName !== "string") {
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    }
    const allowed = await consumeRadarRateLimit(
      radarRequestIdentifier(request, "click"),
      60,
      newsRadarConfig.rateWindowSeconds,
    );
    if (!allowed) return new NextResponse(null, { status: 204 });

    const sources = await listRadarSources(body.category);
    if (!sources.some((source) => source.name === body.sourceName)) {
      return NextResponse.json({ error: "Fonte inválida." }, { status: 400 });
    }
    await Promise.all([
      incrementRadarMetric({ category: body.category, outboundClicks: 1 }),
      incrementRadarSourceClick(body.category, body.sourceName),
    ]);
    return new NextResponse(null, { status: 204 });
  } catch {
    // A telemetria é complementar e nunca deve interferir no clique externo.
    return new NextResponse(null, { status: 204 });
  }
}
