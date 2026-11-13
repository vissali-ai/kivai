import { createHash } from "node:crypto";
import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
import { signAudio } from "@/lib/video-studies/audio-proof";

export const runtime="nodejs";
export const maxDuration=240;
const noCache={"Cache-Control":"private, no-store"};
const fail=(error:string,status=400)=>Response.json({error},{status,headers:noCache});

export async function POST(request:Request){
 if(!["preview","production"].includes(process.env.VERCEL_ENV||""))return fail("Não foi possível preparar o áudio agora.",503);
 let userId:string|null=null,visitor:string|null=null;
 let reserved=false,completed=false;
 try{
  const raw=await request.text();
  if(Buffer.byteLength(raw)>15000)return fail("O resumo é muito extenso para gerar áudio.",413);
  const data=JSON.parse(raw) as {text?:unknown};
  const text=typeof data.text==="string"?data.text.trim():"";
  if(!text||text.length>8000)return fail("Este resumo precisa ter até 8.000 caracteres para gerar áudio.",422);
  const bearer=request.headers.get("authorization");
  if(bearer?.startsWith("Bearer ")){
   const user=await authenticateBillingUser(request);
   userId=user.id;
   reserved=await supabaseRest<boolean>("rpc/kivai_reserve_video_study_usage",{
    method:"POST",body:JSON.stringify({p_user_id:userId,p_kind:"audio"})
   });
  }else{
   const salt=process.env.ADMIN_AUTH_SECRET;
   const ip=request.headers.get("x-vercel-forwarded-for")?.split(",")[0]||request.headers.get("x-real-ip");
   if(!salt||!ip)return fail("Não foi possível iniciar a narração agora.",503);
   visitor=createHash("sha256").update(salt+":video-studies:"+ip).digest("hex");
   reserved=await supabaseRest<boolean>("rpc/kivai_reserve_guest_video_study",{
    method:"POST",body:JSON.stringify({p_visitor_key:visitor,p_kind:"audio"})
   });
  }
  if(!reserved)return fail("Você atingiu a quantidade de narrações deste mês. Consulte os planos para continuar.",429);
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return fail("Não foi possível preparar o áudio agora.",503);
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
   method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
   cache:"no-store",signal:AbortSignal.timeout(180000),
   body:JSON.stringify({
    model:"gemini-3.8-flash-lite-tts",
    input:[{type:"user_input",content:[{type:"text",text,annotations:[{type:"speech_metadata",style:"Narre em português brasileiro, com clareza, tom natural e ritmo agradável para estudo."}]}]}],
    response_format:{type:"audio"},generation_config:{speech_config:[{voice:"Kore"}]}
   })
  });
  if(!response.ok){
   console.warn("[video-narration] provider HTTP",response.status);
   return fail(response.status===429?"O serviço de áudio está com muitas solicitações. Tente novamente.":"Não foi possível gerar o áudio agora.",response.status===429?429:503);
  }
  const generated=await response.json() as {steps?:Array<{type?:string;content?:Array<{type?:string;data?:string}>}>};
  const audio64=generated.steps?.filter(s=>s.type==="model_output").flatMap(s=>s.content??[]).find(s=>s.type==="audio")?.data;
  if(!audio64)return fail("Não foi possível preparar a narração desse resumo.",503);
  const audio=Buffer.from(audio64,"base64");
  if(audio.length<44||audio.toString("ascii",0,4)!=="RIFF"||audio.byteLength>30000000)return fail("Não foi possível preparar a narração desse resumo.",503);
  const hash=createHash("sha256").update(audio).digest("hex");
  const proof=signAudio(hash);
  completed=true;
  return new Response(audio,{status:200,headers:{
   "Content-Type":"audio/wav","Cache-Control":"private, no-store","Content-Disposition":"inline",
   "X-Kivai-Audio-Proof":proof,"X-Kivai-Audio-SHA256":hash
  }});
 }catch(error){
  if(error instanceof Error&&error.message==="UNAUTHORIZED")return fail("Entre novamente na sua conta.",401);
  if(error instanceof Error&&(error.name==="AbortError"||error.name==="TimeoutError"))return fail("A narração demorou mais que o esperado. Tente novamente.",504);
  console.warn("[video-narration] failed",error instanceof Error?error.name:"unknown");
  return fail("Não foi possível gerar o áudio agora. Tente novamente.",503);
 }finally{
  if(reserved&&!completed)try{
   if(userId)await supabaseRest("rpc/kivai_refund_video_study_usage",{method:"POST",body:JSON.stringify({p_user_id:userId,p_kind:"audio"})});
   else if(visitor)await supabaseRest("rpc/kivai_refund_guest_video_study",{method:"POST",body:JSON.stringify({p_visitor_key:visitor,p_kind:"audio"})});
  }catch{console.warn("[video-narration] quota refund failed");}
 }
}
