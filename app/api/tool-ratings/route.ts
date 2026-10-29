import { authenticateBillingUser } from "@/lib/billing/sumup";
import { supabaseRest } from "@/lib/blog/supabase";
import { getRateableTool } from "@/lib/tool-ratings";
import { getToolRatingSummary } from "@/lib/tool-ratings";
const headers = {"Cache-Control":"no-store"};
function error(message: string, status: number) { return Response.json({error:message},{status,headers}); }
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("tool") ?? "";
  if (!(await getRateableTool(slug))) return error("Ferramenta não encontrada.",404);
  return Response.json({summary: await getToolRatingSummary(slug)},{headers});
}
export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(request); }
  catch { return error("Entre na conta para avaliar esta ferramenta.",401); }
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 1024) return error("Requisição muito grande.",413);
    const body = await request.json() as {tool?:unknown;rating?:unknown};
    const slug = typeof body.tool === "string" ? body.tool : "";
    const rating = body.rating;
    if (!(await getRateableTool(slug)) || !Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5) return error("Avaliação inválida.",400);
    await supabaseRest("tool_ratings?on_conflict=tool_slug,user_id", {
      method:"POST",
      headers:{"Prefer":"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify({tool_slug:slug,user_id:user.id,rating,updated_at:new Date().toISOString()})
    });
    return Response.json({ok:true,summary:await getToolRatingSummary(slug)},{headers});
  } catch { return error("Não foi possível salvar a avaliação.",503); }
}
