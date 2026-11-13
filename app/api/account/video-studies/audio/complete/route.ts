import { createHash } from "node:crypto";
import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { verifyAudio } from "@/lib/video-studies/audio-proof";

export const runtime="nodejs";
export const maxDuration=120;
const noCache={"Cache-Control":"private, no-store"};
const fail=(error:string,status=400)=>Response.json({error},{headers:noCache,status});
const isUuid=(x:string)=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(x);
export async function POST(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const body=await request.json() as {id?:string;sha?:string;proof?:string;size?:number};
  const id=body.id??"",sha=body.sha??"",proof=body.proof??"",size=body.size??0;
  if(!isUuid(id)||!Number.isInteger(size)||size<44||size>30000000||!verifyAudio(sha,proof))
   return fail("A narração precisa ser gerada novamente antes de salvar.",422);
  const projects=await supabaseRest<{id:string}[]>(`saved_tool_projects?select=id&user_id=eq.${user.id}&kind=eq.video_summary&id=eq.${id}&limit=1`);
  if(!projects.length)return fail("Resumo não encontrado na biblioteca.",404);
  const path=`${user.id}/${id}.wav`;
  const uploaded=await supabaseStorage(`object/video-study-audio/${path}`,{method:"GET",headers:{"Cache-Control":"no-store"}});
  const bytes=Buffer.from(await uploaded.arrayBuffer());
  if(bytes.byteLength!==size||bytes.byteLength>30000000||bytes.toString("ascii",0,4)!=="RIFF"||createHash("sha256").update(bytes).digest("hex")!==sha)
   return fail("Não foi possível confirmar este áudio. Gere a narração novamente.",422);
  const plan=await supabaseRest<"free"|"pro"|"agency">("rpc/kivai_effective_plan",{
   method:"POST",body:JSON.stringify({p_user_id:user.id})
  });
  const days=plan==="agency"?180:plan==="pro"?90:30;
  const expiresAt=new Date(Date.now()+days*86400000).toISOString();
  await supabaseRest("video_study_audio?on_conflict=project_id",{
   method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},
   body:JSON.stringify({project_id:id,user_id:user.id,storage_path:path,size_bytes:bytes.byteLength,mime_type:"audio/wav",expires_at:expiresAt})
  });
  return Response.json({ok:true,expiresAt},{headers:noCache});
 }catch(error){
  if(error instanceof Error&&error.message==="UNAUTHORIZED")return fail("Entre na sua conta para salvar o áudio.",401);
  console.warn("[video-audio-complete] failed",error instanceof Error?error.name:"unknown");
  return fail("Não foi possível concluir o salvamento do áudio agora.",503);
 }
}
