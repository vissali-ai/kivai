import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { listEditorialTopics } from "@/lib/news-agent/editorial-topics";
import { researchEditorialLinks, type SearchPeriod, type SearchRegion } from "@/lib/news-agent/editorial-links";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as Record<string, unknown>;
    const ids = Array.isArray(body.topics) ? body.topics : [];
    if (ids.length > 100 || ids.some((id) => typeof id !== "string")) throw new Error("Selecione até 100 temas.");
    const topics = (await listEditorialTopics()).filter((topic) => topic.enabled && ids.includes(topic.id));
    if (topics.length !== new Set(ids).size) throw new Error("Um ou mais temas são inválidos ou estão desativados.");
    const freeQuery = typeof body.query === "string" ? body.query.trim() : "";
    if (freeQuery.length > 200 || (!topics.length && !freeQuery)) throw new Error("Selecione um tema ou digite sua pesquisa.");
    const period = body.period as SearchPeriod;
    const region = body.region as SearchRegion;
    if (!["24h", "7d", "30d"].includes(period) || !["brasil", "internacional", "ambos"].includes(region)) {
      throw new Error("Filtros de pesquisa inválidos.");
    }
    return NextResponse.json(await researchEditorialLinks({ topics, freeQuery, period, region }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return apiError(error); }
}
