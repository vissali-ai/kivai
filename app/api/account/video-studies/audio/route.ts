import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { blogConfig } from "@/lib/blog/config";

export const runtime="nodejs";
export const maxDuration=240;
const headers={"Cache-Control":"private, no-store"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Project={id:string;user_id:string;kind:string;payload:{text?:string;mode?:string}};
type Asset={project_id:string;user_id:string;storage_path:string;expires_at:string;size_bytes:number;mime_type:string};
const fail=(error:string,status=400)=>Response.json({error},{status,headers});
async function projectFor(userId:string,projectId:string){
 const rows=await supabaseRest<Project[]>(`saved_tool_projects?select=id,user_id,kind,payload&user_id=eq.${userId}&id=eq.${projectId}&kind=eq.video_summary&limit=1`);
 return rows[0]??null;
}
async function assetFor(userId:string,projectId:string){
 const rows=await supabaseRest<Asset[]>(`video_study_audio?select=project_id,user_id,storage_path,expires_at,size_bytes,mime_type&user_id=eq.${userId}&project_id=eq.${projectId}&limit=1`);
 return rows[0]??null;
}
async function playUrl(asset:Asset){
 const resp=await supabaseStorage(`object/sign/video-study-audio/${asset.storage_path}`,{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expiresIn:300})
 });
 const data=await resp.json() as {signedURL?:string;signedUrl?:string};
 const relative=data.signedURL??data.signedUrl??"";
 if(!relative.startsWith("/object/sign/"))throw new Error("INVALID_AUDIO_URL");
 return new URL("/storage/v1"+relative,blogConfig.supabaseUrl).toString();
}
export async function GET(request:Request){
 try{
  const user=await authenticateBillingUser(request);
  const projectId=new URL(request.url).searchParams.get("id")??"";
  if(!uuid.test(projectId)||!await projectFor(user.id,projectId))return fail("Resumo não encontrado.",404);
  const asset=await assetFor(user.id,projectId);
  if(!asset||Date.parse(asset.expires_at)<=Date.now())return fail("Narração não disponível ou expirada.",404);
  return Response.json({url:await playUrl(asset),expiresAt:asset.expires_at,mimeType:asset.mime_type},{headers});
 }catch(error){return fail(error instanceof Error&&error.message==="UNAUTHORIZED"?"Entre na sua conta.":"Não foi possível acessar o áudio.",503);}
}
export async function POST(request:Request){
 let userId:string|null=null;let reserved=false;
 try{
  if(process.env.VERCEL_ENV!=="preview")return fail("Disponível somente na homologação.",404);
  const user=await authenticateBillingUser(request);userId=user.id;
  const body=await request.json() as {id?:string};
  const id=body.id??"";
  if(!uuid.test(id))return fail("Resumo inválido.");
  const project=await projectFor(user.id,id);
  if(!project)return fail("Resumo não encontrado.",404);
  if(project.payload.mode!=="summary")return fail("A narração só está disponível para resumos inteligentes.",422);
  const text=project.payload.text?.trim()??"";
  if(!text||text.length>8000)return fail("O resumo precisa ter entre 1 e 8.000 caracteres para gerar áudio.",422);
  const old=await assetFor(user.id,id);
  if(old&&Date.parse(old.expires_at)>Date.now())return Response.json({url:await playUrl(old),expiresAt:old.expires_at,reused:true},{headers});
  const allowed=await supabaseRest<boolean>("rpc/kivai_reserve_video_study_usage",{method:"POST",body:JSON.stringify({p_user_id:user.id,p_kind:"audio"})});
  if(!allowed)return fail("Limite mensal de geração de áudios atingido.",429);
  reserved=true;
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)throw new Error("NO_GEMINI_KEY");
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
   method:"POST",
   headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
   cache:"no-store",signal:AbortSignal.timeout(185000),
   body:JSON.stringify({
    model:"gemini-3.8-flash-lite-tts",
    input:[{type:"user_input",content:[{type:"text",text,annotations:[{type:"speech_metadata",style:"Narrar naturalmente, com dicção clara em português brasileiro, tom de estudo."}]}]}],
    response_format:{type:"audio"},
    generation_config:{speech_config:[{voice:"Kore"}]},
   })
  });
  if(!response.ok){console.warn("[video-study-tts] provider HTTP",response.status);throw new Error(response.status===429?"RATE_LIMIT":"GEMINI_TTS_ERROR");}
  const output=await response.json() as {steps?:Array<{type?:string;content?:Array<{type?:string;data?:string;mime_type?:string}>}>};
  const audioBase64=output.steps?.filter(s=>s.type==="model_output").flatMap(s=>s.content??[]).find(s=>s.type==="audio")?.data;
  if(!audioBase64)throw new Error("EMPTY_TTS_AUDIO");
  const bytes=Buffer.from(audioBase64,"base64");
  if(bytes.byteLength<44||bytes.toString("ascii",0,4)!=="RIFF"||bytes.byteLength>30000000)throw new Error("INVALID_TTS_AUDIO");
  const path=`${user.id}/${id}.wav`;
  await supabaseStorage(`object/video-study-audio/${path}`,{
   method:"POST",headers:{"Content-Type":"audio/wav","x-upsert":"true","cache-control":"private,max-age=0"},body:bytes
  });
  const plan=await supabaseRest<"free"|"pro"|"agency">("rpc/kivai_effective_plan",{method:"POST",body:JSON.stringify({p_user_id:user.id})});
  const days=plan==="agency"?180:plan==="pro"?90:30;
  const expiresAt=new Date(Date.now()+days*86400000).toISOString();
  await supabaseRest("video_study_audio?on_conflict=project_id",{
   method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},
   body:JSON.stringify({project_id:id,user_id:user.id,storage_path:path,size_bytes:bytes.byteLength,mime_type:"audio/wav",expires_at:expiresAt})
  });
  reserved=false;
  return Response.json({url:await playUrl({project_id:id,user_id:user.id,storage_path:path,size_bytes:bytes.byteLength,mime_type:"audio/wav",expires_at:expiresAt}),expiresAt,reused:false},{headers});
 }catch(error){
  if(reserved&&userId)try{await supabaseRest("rpc/kivai_refund_video_study_usage",{method:"POST",body:JSON.stringify({p_user_id:userId,p_kind:"audio"})});}catch{console.warn("[video-study-tts] quota refund unavailable");}
  return fail(error instanceof Error&&error.message==="UNAUTHORIZED"?"Entre na sua conta para gerar áudio.":"Não foi possível gerar a narração. Nenhuma geração concluída será cobrada.",503);
 }
}
