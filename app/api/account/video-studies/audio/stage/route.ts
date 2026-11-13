import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { blogConfig } from "@/lib/blog/config";
import { verifyAudio } from "@/lib/video-studies/audio-proof";

export const runtime="nodejs";
const noCache={"Cache-Control":"private, no-store"};
const fail=(error:string,status=400)=>Response.json({error},{headers:noCache,status});
const isUuid=(x:string)=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(x);
export async function POST(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const json=await request.json() as {id?:string;sha?:string;proof?:string;size?:number};
  const id=json.id||"",sha=json.sha||"",proof=json.proof||"",size=json.size;
  if(!isUuid(id)||typeof size!=="number"||!Number.isInteger(size)||size<44||size>30000000||!verifyAudio(sha,proof))
   return fail("A narração precisa ser gerada novamente antes de salvar.",422);
  const projects=await supabaseRest<{id:string}[]>(`saved_tool_projects?select=id&user_id=eq.${user.id}&kind=eq.video_summary&id=eq.${id}&limit=1`);
  if(projects.length!==1)return fail("Salve o resumo antes de guardar a narração.",404);
  const existing=await supabaseRest<{project_id:string}[]>(`video_study_audio?select=project_id&user_id=eq.${user.id}&project_id=eq.${id}&limit=1`);
  if(existing.length)return fail("Este resumo já possui uma narração salva.",409);
  const path=`${user.id}/${id}.wav`;
  const signed=await supabaseStorage(`object/upload/sign/video-study-audio/${path}`,{
   method:"POST",headers:{"Content-Type":"application/json"},body:"{}"
  });
  const data=await signed.json() as {url?:string};
  if(!data.url?.startsWith("/object/upload/sign/video-study-audio/"))return fail("Não foi possível guardar o áudio agora.",503);
  const signedUrl=new URL("/storage/v1"+data.url,blogConfig.supabaseUrl).toString();
  return Response.json({url:signedUrl},{headers:noCache});
 }catch(error){
  if(error instanceof Error&&error.message==="UNAUTHORIZED")return fail("Entre na sua conta para salvar o áudio.",401);
  console.warn("[video-audio-stage] failed",error instanceof Error?error.name:"unknown");
  return fail("Não foi possível guardar o áudio agora.",503);
 }
}
