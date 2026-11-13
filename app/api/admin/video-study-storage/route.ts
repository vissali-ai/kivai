import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
export const runtime="nodejs";
export const maxDuration=120;
const headers={"Cache-Control":"private, no-store"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Project={id:string;user_id:string;title:string;payload:{text?:string;source?:string;mode?:string};updated_at:string};
type Audio={project_id:string;user_id:string;storage_path:string;size_bytes:number;expires_at:string};
type List={id:string;user_id:string;name:string};
function fail(message:string,status=400){return Response.json({error:message},{status,headers});}
async function listData(){
 const [projects,audios,playlists]=await Promise.all([
  supabaseRest<Project[]>("saved_tool_projects?select=id,user_id,title,payload,updated_at&kind=eq.video_summary&order=updated_at.desc&limit=500"),
  supabaseRest<Audio[]>("video_study_audio?select=project_id,user_id,storage_path,size_bytes,expires_at&order=expires_at.asc&limit=500"),
  supabaseRest<List[]>("video_study_playlists?select=id,user_id,name&order=created_at.desc&limit=500"),
 ]);
 return {projects,audios,playlists};
}
export async function GET(){
 try{await assertAdminApi();const {projects,audios,playlists}=await listData();
 return Response.json({
  projects, audios:audios.map(({storage_path: _secret,...item})=>item),playlists,
  totals:{projects:projects.length,audios:audios.length,playlists:playlists.length,
   audioBytes:audios.reduce((total,a)=>total+a.size_bytes,0),
   textBytes:projects.reduce((total,p)=>total+Buffer.byteLength(p.payload?.text??"","utf8"),0)}
 },{headers});
 }catch{return fail("Acesso administrativo não autorizado ou dados indisponíveis.",403);}
}
async function removeAudio(asset:Audio){
 await supabaseStorage(`object/video-study-audio/${asset.storage_path}`,{method:"DELETE"});
 await supabaseRest(`video_study_audio?project_id=eq.${asset.project_id}&user_id=eq.${asset.user_id}`,{method:"DELETE"});
}
async function audit(action:string,userId:string,projectId:string|null){
 await supabaseRest("video_study_admin_audit",{method:"POST",body:JSON.stringify({action,subject_user_id:userId,project_id:projectId})});
}
export async function DELETE(request:Request){
 try{
  await assertAdminApi();
  const data=await request.json() as {action?:string;id?:string;confirm?:string};
  if(!uuid.test(data.id??"")||data.confirm!=="EXCLUIR DEFINITIVAMENTE")return fail("Confirme a exclusão definitiva.");
  const {projects,audios,playlists}=await listData();
  if(data.action==="audio"){
   const asset=audios.find(a=>a.project_id===data.id);
   if(!asset)return fail("Áudio não encontrado.",404);
   await removeAudio(asset);await audit("delete_audio",asset.user_id,asset.project_id);
  }else if(data.action==="project"){
   const project=projects.find(p=>p.id===data.id);
   if(!project)return fail("Resumo não encontrado.",404);
   const asset=audios.find(a=>a.project_id===project.id);
   if(asset)await removeAudio(asset);
   await supabaseRest(`saved_tool_projects?id=eq.${project.id}&user_id=eq.${project.user_id}&kind=eq.video_summary`,{method:"DELETE"});
   await audit("delete_project",project.user_id,project.id);
  }else if(data.action==="playlist"){
   const playlist=playlists.find(p=>p.id===data.id);
   if(!playlist)return fail("Playlist não encontrada.",404);
   await supabaseRest(`video_study_playlists?id=eq.${playlist.id}&user_id=eq.${playlist.user_id}`,{method:"DELETE"});
   await audit("delete_playlist",playlist.user_id,null);
  }else return fail("Tipo de exclusão inválido.");
  return Response.json({ok:true},{headers});
 }catch{return fail("Falha na exclusão ou operação administrativa não autorizada.",503);}
}
export async function POST(request:Request){
 try{
  await assertAdminApi();
  const data=await request.json() as {action?:string};
  if(data.action!=="cleanup_expired")return fail("Ação inválida.");
  const expired=await supabaseRest<Audio[]>(`video_study_audio?select=project_id,user_id,storage_path,size_bytes,expires_at&expires_at=lt.${encodeURIComponent(new Date().toISOString())}&limit=50`);
  let removed=0;
  for(const item of expired){
   try{
    await removeAudio(item);
    await audit("cleanup_expired",item.user_id,item.project_id);
    removed++;
   }catch{console.warn("[study-maintenance] could not remove one expired object");}
  }
  return Response.json({removed,remainingMayExist:expired.length===50},{headers});
 }catch{return fail("Não foi possível concluir a limpeza administrativa.",503);}
}
