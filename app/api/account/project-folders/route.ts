import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";

type Folder = { id: string; user_id: string; name: string; created_at: string };
type Assignment = { user_id: string; project_id: string; folder_id: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  return Response.json({
    error: error instanceof Error && error.message === "UNAUTHORIZED"
      ? "Faça login para organizar seus projetos."
      : "Não foi possível atualizar suas pastas. Tente novamente.",
  }, { status: error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 503, headers });
}
async function bodyOf(request: Request) {
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 4096) return null;
  try { return JSON.parse(body) as Record<string, unknown>; } catch { return null; }
}
export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const [folders, assignments] = await Promise.all([
      supabaseRest<Folder[]>(`account_project_folders?select=id,user_id,name,created_at&user_id=eq.${encodeURIComponent(user.id)}&order=name.asc&limit=100`),
      supabaseRest<Assignment[]>(`account_project_folder_items?select=user_id,project_id,folder_id&user_id=eq.${encodeURIComponent(user.id)}&limit=200`),
    ]);
    return Response.json({ folders, assignments }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await bodyOf(request);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) return Response.json({ error: "Informe um nome de até 80 caracteres." }, { status: 400, headers });
    const folders = await supabaseRest<Pick<Folder, "id" | "name">[]>(`account_project_folders?select=id,name&user_id=eq.${encodeURIComponent(user.id)}&limit=101`);
    if (folders.length >= 100) return Response.json({ error: "Limite de 100 pastas atingido." }, { status: 409, headers });
    if (folders.some(folder => folder.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      return Response.json({ error: "Já existe uma pasta com esse nome." }, { status: 409, headers });
    }
    const created = await supabaseRest<Folder[]>("account_project_folders", {
      method: "POST", body: JSON.stringify({ user_id: user.id, name }),
    });
    return Response.json({ folder: created[0] }, { status: 201, headers });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await bodyOf(request);
    const id = body?.id;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (typeof id !== "string" || !uuid.test(id) || !name || name.length > 80)
      return Response.json({ error: "Revise a pasta e o nome." }, { status: 400, headers });
    const updated = await supabaseRest<Folder[]>(`account_project_folders?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      method: "PATCH", body: JSON.stringify({ name }),
    });
    if (!updated.length) return Response.json({ error: "Pasta não encontrada." }, { status: 404, headers });
    return Response.json({ folder: updated[0] }, { headers });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!uuid.test(id)) return Response.json({ error: "Pasta inválida." }, { status: 400, headers });
    const deleted = await supabaseRest<Folder[]>(`account_project_folders?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
    if (!deleted.length) return Response.json({ error: "Pasta não encontrada." }, { status: 404, headers });
    return Response.json({ ok: true }, { headers });
  } catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await bodyOf(request);
    const projectId = body?.projectId;
    const folderId = body?.folderId;
    if (typeof projectId !== "string" || !uuid.test(projectId) || (folderId !== null && (typeof folderId !== "string" || !uuid.test(folderId))))
      return Response.json({ error: "Projeto ou pasta inválidos." }, { status: 400, headers });
    const project = await supabaseRest<{ id: string }[]>(`saved_tool_projects?select=id&id=eq.${encodeURIComponent(projectId)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    if (!project.length) return Response.json({ error: "Projeto não encontrado." }, { status: 404, headers });
    const path = `account_project_folder_items?user_id=eq.${encodeURIComponent(user.id)}&project_id=eq.${encodeURIComponent(projectId)}`;
    if (folderId === null) {
      await supabaseRest(path, { method: "DELETE" });
    } else {
      const folder = await supabaseRest<{ id: string }[]>(`account_project_folders?select=id&id=eq.${encodeURIComponent(folderId)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
      if (!folder.length) return Response.json({ error: "Pasta não encontrada." }, { status: 404, headers });
      await supabaseRest("account_project_folder_items?on_conflict=user_id,project_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ user_id: user.id, project_id: projectId, folder_id: folderId }),
      });
    }
    return Response.json({ ok: true }, { headers });
  } catch (error) { return failure(error); }
}
