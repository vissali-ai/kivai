import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status = 400) => Response.json({ error }, { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type SavedProject = { id: string; user_id: string; kind: string; title: string; updated_at: string; bytes: number };

export async function GET() {
  try {
    await assertAdminApi();
    const rows = (await supabaseRest<SavedProject[]>("rpc/kivai_admin_saved_projects", { method: "POST", body: "{}" })).filter(row => row.kind !== "video_summary");
    return Response.json({ projects: rows }, { headers });
  } catch { return fail("Acesso não autorizado ou inventário indisponível.", 403); }
}

export async function DELETE(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as { id?: string; userId?: string; confirm?: string };
    if (!uuid.test(body.id ?? "") || !uuid.test(body.userId ?? "") || body.confirm !== "EXCLUIR DEFINITIVAMENTE") return fail("Confirme os dados para exclusão definitiva.");
    const rows = await supabaseRest<Array<{ id: string; kind: string }>>(`saved_tool_projects?select=id,kind&id=eq.${body.id}&user_id=eq.${body.userId}&limit=1`);
    if (!rows[0]) return fail("Projeto não encontrado.", 404);
    if (rows[0].kind === "video_summary") return fail("Remova estudos de vídeo pelo inventário de estudos para apagar também os arquivos associados.");
    await supabaseRest(`saved_tool_projects?id=eq.${body.id}&user_id=eq.${body.userId}`, { method: "DELETE" });
    return Response.json({ ok: true }, { headers });
  } catch { return fail("Falha na exclusão ou operação administrativa não autorizada.", 503); }
}
