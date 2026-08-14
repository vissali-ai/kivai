import { NextResponse } from "next/server";
import { newsRadarConfig } from "@/lib/news-radar/config";
import { consumeRadarRateLimit } from "@/lib/news-radar/repository";
import { publicRadarError, radarRequestIdentifier } from "@/lib/news-radar/request";
import { searchNewsRadar } from "@/lib/news-radar/service";
import { isNewsRadarCategory } from "@/lib/news-radar/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { category?: unknown };
    if (!isNewsRadarCategory(body.category)) {
      return NextResponse.json({ error: "Selecione uma categoria válida." }, { status: 400 });
    }

    const allowed = await consumeRadarRateLimit(
      radarRequestIdentifier(request, "search"),
      newsRadarConfig.requestLimit,
      newsRadarConfig.rateWindowSeconds,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas buscas em pouco tempo. Aguarde alguns minutos para tentar novamente." },
        { status: 429, headers: { "Retry-After": String(newsRadarConfig.rateWindowSeconds) } },
      );
    }

    return NextResponse.json(await searchNewsRadar(body.category), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[news-radar] Falha ao processar busca", error);
    return NextResponse.json({ error: publicRadarError(error) }, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "30" },
    });
  }
}
