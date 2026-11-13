import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;
type Project = { id: string; user_id: string; kind: string; title: string; payload: { source?: string; text?: string; mode?: string }; revision: number; updated_at: string };
type Audio = { project_id: string; user_id: string; storage_path: string; size_bytes: number; expires_at: string; mime_type: string };
function fail(error: string, status = 400) { return Response.json({ error }, { status, headers }); }
function message(reason: unknown) {
 const raw = reason instanceof Error ? reason.message : "";
 return ["Limite de resumos salvos atingido","Resumo não encontrado","Resumo alterado em outra aba"].find(x => raw.includes(x)) ?? "Não foi possível atualizar a biblioteca.";
}
export async function GET(request: Request) {
 try {
  const user = await authenticateBillingUser(request);
  const [projects, audios, playlists, entries, usage] = await Promise.all([
   supabaseRest<Project[]>(`saved_tool_projects?select=id,user_id,kind,title,payload,revision,updated_at&user_id=eq.${user.id}&kind=eq.video_summary&order=updated_at.desc&limit=500`),
   supabaseRest<Audio[]>(`video_study_audio?select=project_id,user_id,storage_path,size_bytes,expires_at,mime_type&user_id=eq.${user.id}&limit=500`),
   supabaseRest(`video_study_playlists?select=id,name,created_at&user_id=eq.${user.id}&order=created_at.asc&limit=100`),
   supabaseRest(`video_study_playlist_entries?select=playlist_id,project_id,position&user_id=eq.${user.id}&order=position.asc&limit=1500`),
   supabaseRest(`video_study_usage?select=summaries,audio,month_start&user_id=eq.${user.id}&month_start=eq.${new Date().toISOString().slice(0,7)}-01&limit=1`),
  ]);
  return Response.json({ projects, audios: audios.map(({storage_path: _private, ...item})=>item), playlists, entries, usage }, { headers });
 } catch (error) { return fail(error instanceof Error && error.message==="UNAUTHORIZED" ? "Entre na sua conta para acessar a biblioteca." : "Biblioteca indisponível.",error instanceof Error && error.message==="UNAUTHORIZED" ? 401:503); }
}
export async function POST(request: Request) {
 try {
  const user = await authenticateBillingUser(request);
  const raw = await request.text();
  if (Buffer.byteLength(raw)>180000) return fail("Resumo excede o limite de armazenamento.",413);
  const body = JSON.parse(raw) as {id?:string;title?:string;text?:string;source?:string;mode?:string;partial?:boolean;revision?:number};
  const title=body.title?.trim()??"";
  const text=body.text?.trim()??"";
  const source=body.source??"";
  const mode=body.mode;
  if (!title || title.length>120 || text.length>100000 || !text || !/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}$/.test(source) || !["summary","transcript"].includes(mode??""))
   return fail("Revise o título, o resumo e o link público.");
  if(body.id && !uuid.test(body.id))return fail("Projeto inválido.");
  const payload={ source,text,mode,partial:body.partial===true };
  const project=await supabaseRest("rpc/kivai_save_video_project",{method:"POST",body:JSON.stringify({p_user_id:user.id,p_id:body.id??null,p_title:title,p_payload:payload,p_revision:body.revision??0})});
  return Response.json({project},{headers,status:201});
 }catch(error){return fail(error instanceof Error && error.message==="UNAUTHORIZED"?"Entre na sua conta para salvar.":message(error),error instanceof Error && error.message==="UNAUTHORIZED"?401:409);}
}
export async function DELETE(request: Request) {
 try {
  const user=await authenticateBillingUser(request);
  const id=new URL(request.url).searchParams.get("id")??"";
  if(!uuid.test(id))return fail("Resumo inválido.");
  const match=await supabaseRest<Project[]>(`saved_tool_projects?select=id,user_id,kind,title,payload,revision,updated_at&user_id=eq.${user.id}&kind=eq.video_summary&id=eq.${id}&limit=1`);
  if(!match.length)return fail("Resumo não encontrado.",404);
  const audios=await supabaseRest<Audio[]>(`video_study_audio?select=project_id,user_id,storage_path,size_bytes,expires_at,mime_type&user_id=eq.${user.id}&project_id=eq.${id}&limit=1`);
  if(audios.length) await supabaseStorage("object/video-study-audio/"+audios[0].storage_path,{method:"DELETE"});
  await supabaseRest(`saved_tool_projects?id=eq.${id}&user_id=eq.${user.id}&kind=eq.video_summary`,{method:"DELETE"});
  return Response.json({ok:true},{headers});
 }catch(error){return fail(error instanceof Error && error.message==="UNAUTHORIZED"?"Entre na sua conta.":"Não foi possível excluir o projeto.",503);}
}
