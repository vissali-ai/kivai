import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
const headers={"Cache-Control":"private, no-store"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(error:string,status=400)=>Response.json({error},{headers,status});
type List={id:string;user_id:string;name:string};
async function checkPlaylist(userId:string,id:string){
 const lists=await supabaseRest<List[]>(`video_study_playlists?select=id,user_id,name&id=eq.${id}&user_id=eq.${userId}&limit=1`);
 return lists[0]??null;
}
export async function POST(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const body=await request.json() as {name?:string};
  const name=body.name?.trim()??"";
  if(!name||name.length>80)return fail("Informe um nome de até 80 caracteres.");
  const cap=20; // Gratuito para todas as contas. Limite somente de organização.
  const current=await supabaseRest<List[]>(`video_study_playlists?select=id,user_id,name&user_id=eq.${user.id}&limit=${cap+1}`);
  if(current.length>=cap)return fail("Capacidade de playlists atingida. Exclua uma lista para criar outra.",409);
  const list=await supabaseRest<List[]>("video_study_playlists",{method:"POST",body:JSON.stringify({user_id:user.id,name})});
  return Response.json({playlist:list[0]},{headers,status:201});
 }catch(error){return fail(error instanceof Error&&error.message==="UNAUTHORIZED"?"Entre na sua conta.":"Não foi possível criar a playlist.",503);}
}
export async function PUT(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const body=await request.json() as {playlistId?:string;projectId?:string;position?:number};
  if(!uuid.test(body.playlistId??"")||!uuid.test(body.projectId??""))return fail("Playlist ou resumo inválido.");
  const playlist=await checkPlaylist(user.id,body.playlistId!);
  if(!playlist)return fail("Playlist não encontrada.",404);
  const projects=await supabaseRest<{id:string}[]>(`saved_tool_projects?select=id&user_id=eq.${user.id}&kind=eq.video_summary&id=eq.${body.projectId}&limit=1`);
  if(!projects.length)return fail("Resumo não encontrado.",404);
  const existing=await supabaseRest<{project_id:string;position:number}[]>(`video_study_playlist_entries?select=project_id,position&user_id=eq.${user.id}&playlist_id=eq.${playlist.id}&limit=501`);
  if(!existing.some(x=>x.project_id===body.projectId)&&existing.length>=500)return fail("Playlist atingiu 500 resumos.",409);
  const position=Number.isInteger(body.position)?Math.min(500,Math.max(0,body.position!)):existing.length;
  await supabaseRest("video_study_playlist_entries?on_conflict=playlist_id,project_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({user_id:user.id,playlist_id:playlist.id,project_id:body.projectId,position})});
  return Response.json({ok:true},{headers});
 }catch(error){return fail(error instanceof Error&&error.message==="UNAUTHORIZED"?"Entre na sua conta.":"Não foi possível organizar esta playlist.",503);}
}
export async function PATCH(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const body=await request.json() as {id?:string;name?:string};
  if(!uuid.test(body.id??"")||!body.name?.trim()||body.name.trim().length>80)return fail("Dados inválidos.");
  if(!await checkPlaylist(user.id,body.id!))return fail("Playlist não encontrada.",404);
  await supabaseRest(`video_study_playlists?id=eq.${body.id}&user_id=eq.${user.id}`,{method:"PATCH",body:JSON.stringify({name:body.name.trim()})});
  return Response.json({ok:true},{headers});
 }catch(error){return fail(error instanceof Error&&error.message==="UNAUTHORIZED"?"Entre na sua conta.":"Não foi possível renomear a playlist.",503);}
}
export async function DELETE(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const url=new URL(request.url);
  const id=url.searchParams.get("id")??"";
  const projectId=url.searchParams.get("projectId");
  if(!uuid.test(id)||projectId!==null&&!uuid.test(projectId))return fail("Identificador inválido.");
  if(!await checkPlaylist(user.id,id))return fail("Playlist não encontrada.",404);
  if(projectId){
   await supabaseRest(`video_study_playlist_entries?playlist_id=eq.${id}&project_id=eq.${projectId}&user_id=eq.${user.id}`,{method:"DELETE"});
  }else{
   await supabaseRest(`video_study_playlists?id=eq.${id}&user_id=eq.${user.id}`,{method:"DELETE"});
  }
  return Response.json({ok:true},{headers});
 }catch(error){return fail(error instanceof Error&&error.message==="UNAUTHORIZED"?"Entre na sua conta.":"Falha ao excluir playlist.",503);}
}
