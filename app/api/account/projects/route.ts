import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
import { projectInput } from "@/lib/projects/validation";
import { supabaseStorage } from "@/lib/blog/supabase";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Faça login para acessar seus projetos." }, { status: 401 });
  const expected = ["Plano pago ativo necessário", "Organização por cliente é exclusiva do Agency", "Limite de projetos atingido", "Limite de 20 clientes atingido", "Projeto não encontrado", "Projeto alterado em outra aba. Abra novamente antes de salvar", "Renove o Agency ou salve uma cópia pessoal"];
  const safe = expected.find(value => message.includes(value));
  return Response.json({ error: safe || "Não foi possível acessar os projetos. Tente novamente." }, { status: safe ? 409 : 503 });
}
export async function GET(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const projects = await supabaseRest(`saved_tool_projects?select=id,kind,title,client_name,payload,revision,updated_at&user_id=eq.${encodeURIComponent(user.id)}&order=updated_at.desc&limit=200`);
    return Response.json({ projects }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 524288) return Response.json({ error: "O projeto excede 512 KB. Reduza o conteúdo ou salve sem imagens grandes." }, { status: 413 });
    let json: unknown; try { json = JSON.parse(raw); } catch { return Response.json({ error: "Projeto inválido." }, { status: 400 }); }
    const parsed = projectInput.safeParse(json);
    if (!parsed.success) return Response.json({ error: "Revise o nome e os dados do projeto." }, { status: 400 });
    const value = parsed.data;
    if(value.kind === "video_summary") {
      const project = await supabaseRest("rpc/kivai_save_video_project", { method: "POST", body: JSON.stringify({p_user_id:user.id,p_id:value.id??null,p_title:value.title,p_payload:value.payload,p_revision:value.revision??0}) });
      return Response.json({project});
    }
    const project = await supabaseRest("rpc/kivai_save_project", { method: "POST", body: JSON.stringify({ p_user_id: user.id, p_id: value.id ?? null, p_kind: value.kind, p_title: value.title, p_client: value.clientName, p_payload: value.payload, p_revision: value.revision ?? 0 }) });
    return Response.json({ project });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[a-f\d-]{36}$/i.test(id)) return Response.json({ error: "Projeto inválido." }, { status: 400 });
    const videoProjects = await supabaseRest<{id:string}[]>(`saved_tool_projects?select=id&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&kind=eq.video_summary&limit=1`);
    if(videoProjects.length){
      const audio = await supabaseRest<{storage_path:string}[]>(`video_study_audio?select=storage_path&project_id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
      if(audio.length)await supabaseStorage(`object/video-study-audio/${audio[0].storage_path}`,{method:"DELETE"});
    }
    await supabaseRest(`saved_tool_projects?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
    return Response.json({ ok: true });
  } catch (error) { return failure(error); }
}
