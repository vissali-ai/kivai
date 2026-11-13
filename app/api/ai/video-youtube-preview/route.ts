import { createHash } from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";
import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";

export const runtime = "nodejs";
export const maxDuration = 240;
const noCache = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers: noCache });

function parseYoutubeUrl(raw: unknown): { url: string; videoId: string } | null {
 if(typeof raw!=="string"||raw.length>300)return null;
 let address:URL;
 try{address=new URL(raw.trim());}catch{return null;}
 if(address.protocol!=="https:")return null;
 const host=address.hostname.toLowerCase();
 let id:string|null=null;
 if(host==="youtu.be")id=address.pathname.split("/")[1];
 else if(["youtube.com","www.youtube.com","m.youtube.com"].includes(host)){
  if(address.pathname==="/watch")id=address.searchParams.get("v");
  else if(/^\/(shorts|live)\//.test(address.pathname))id=address.pathname.split("/")[2];
 }
 if(!id||!/^[a-zA-Z0-9_-]{11}$/.test(id))return null;
 return {url:`https://www.youtube.com/watch?v=${id}`,videoId:id};
}
function visitorHash(request:Request){
 const salt=process.env.ADMIN_AUTH_SECRET;
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-vercel-forwarded-for")?.split(",")[0];
 if(!salt||!ip)throw new Error("VISITOR_CHECK_UNAVAILABLE");
 return createHash("sha256").update(salt+":video-studies:"+ip).digest("hex");
}
async function checkDuration(videoId:string,maximumSeconds:number){
 const key=process.env.YOUTUBE_DATA_API_KEY;
 if(!key)throw new Error("METADATA_UNAVAILABLE");
 const response=await fetch("https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id="+encodeURIComponent(videoId)+"&key="+encodeURIComponent(key),{
  cache:"no-store",signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw new Error("METADATA_UNAVAILABLE");
 const data=await response.json() as {items?:Array<{contentDetails?:{duration?:string}}>} ;
 const duration=data.items?.[0]?.contentDetails?.duration||"";
 const match=/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
 if(!match)throw new Error("VIDEO_DURATION_UNKNOWN");
 const seconds=Number(match[1]||0)*86400+Number(match[2]||0)*3600+Number(match[3]||0)*60+Number(match[4]||0);
 if(seconds<1)throw new Error("VIDEO_DURATION_UNKNOWN");
 if(seconds>maximumSeconds)throw new Error("VIDEO_TOO_LONG");
 return seconds;
}
type Interaction={status?:string;steps?:Array<{type?:string;content?:Array<{type?:string;text?:string}>}>};
export async function POST(request:Request){
 if(!["preview","production"].includes(process.env.VERCEL_ENV||""))return fail("Serviço indisponível.",503);
 let input:{url?:unknown};
 try{
  const raw=await request.text();
  if(Buffer.byteLength(raw)>1024)return fail("Revise o endereço do vídeo.",413);
  input=JSON.parse(raw);
 }catch{return fail("Informe um link válido do YouTube.",400);}
 const youtube=parseYoutubeUrl(input?.url);
 if(!youtube)return fail("Cole um link público válido do YouTube.",400);
 if(!process.env.GEMINI_API_KEY)return fail("Não foi possível iniciar o resumo agora.",503);
 let userId:string|null=null;
 let visitor:string|null=null;
 let reserved=false;
 let completed=false;
 try{
  const authorization=request.headers.get("authorization");
  if(authorization?.startsWith("Bearer ")){
   const user=await authenticateBillingUser(request);
   userId=user.id;
  }
  const plan=userId?await supabaseRest<"free"|"pro"|"agency">("rpc/kivai_effective_plan",{method:"POST",body:JSON.stringify({p_user_id:userId})}):"free";
  const maxSeconds=plan==="agency"?3600:plan==="pro"?1800:720;
  try{await checkDuration(youtube.videoId,maxSeconds);}
  catch(error){
   if(error instanceof Error&&error.message==="VIDEO_TOO_LONG")return fail(`Este vídeo ultrapassa o limite de ${Math.round(maxSeconds/60)} minutos do seu plano.`,422);
   if(error instanceof Error&&error.message==="VIDEO_DURATION_UNKNOWN")return fail("Não foi possível identificar a duração desse vídeo. Escolha outro vídeo público.",422);
   return fail("Não foi possível verificar a duração do vídeo. Tente novamente.",503);
  }
  if(userId){
   reserved=await supabaseRest<boolean>("rpc/kivai_reserve_video_study_usage",{
    method:"POST",body:JSON.stringify({p_user_id:userId,p_kind:"summary"})
   });
  }else{
   visitor=visitorHash(request);
   reserved=await supabaseRest<boolean>("rpc/kivai_reserve_guest_video_study",{
    method:"POST",body:JSON.stringify({p_visitor_key:visitor,p_kind:"summary"})
   });
  }
  if(!reserved)return fail("Você atingiu a quantidade de resumos deste mês. Consulte os planos para continuar.",429);
  const instruction="Analise este vídeo público do YouTube. Em português brasileiro, escreva um título claro, um resumo fiel em até cinco parágrafos e de cinco a dez tópicos principais. Inclua tempos [mm:ss] apenas quando puder verificá-los. Não invente afirmações ou tempos. Se o vídeo estiver inacessível, informe a limitação em vez de criar conteúdo fictício. Responda diretamente com o resumo.";
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
   method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
   cache:"no-store",signal:AbortSignal.timeout(180000),
   body:JSON.stringify({model:"gemini-3.5-flash-lite",input:[{type:"text",text:instruction},{type:"video",uri:youtube.url}]})
  });
  if(!response.ok){
   console.warn("[kivai-video-summary] provider HTTP",response.status);
   if(response.status===429)return fail("O serviço está com muitas solicitações agora. Tente novamente.",429);
   return fail("Não foi possível concluir o resumo agora. Tente novamente.",503);
  }
  const data=await response.json() as Interaction;
  const summary=data.steps?.filter(x=>x.type==="model_output").flatMap(x=>x.content||[])
   .filter(x=>x.type==="text"&&typeof x.text==="string").map(x=>x.text?.trim()||"").filter(Boolean).join("\n\n").trim()||"";
  if(!summary)return fail("Não foi possível gerar um resumo desse vídeo. Experimente outro link.",503);
  if(summary.length>100000)return fail("O resumo ficou muito extenso. Experimente outro vídeo.",503);
  completed=true;
  return Response.json({text:summary,mode:"summary",source:youtube.url,partial:data.status!=="completed"},{headers:noCache});
 }catch(error){
  if(error instanceof Error&&error.message==="UNAUTHORIZED")return fail("Entre novamente na sua conta para continuar.",401);
  if(error instanceof Error&&(error.name==="TimeoutError"||error.name==="AbortError"))return fail("O resumo demorou mais que o esperado. Tente novamente.",504);
  console.warn("[kivai-video-summary] failed",error instanceof Error?error.name:"unknown");
  return fail("Não foi possível gerar o resumo agora. Tente novamente.",503);
 }finally{
  if(reserved&&!completed){
   try{
    if(userId)await supabaseRest("rpc/kivai_refund_video_study_usage",{method:"POST",body:JSON.stringify({p_user_id:userId,p_kind:"summary"})});
    else if(visitor)await supabaseRest("rpc/kivai_refund_guest_video_study",{method:"POST",body:JSON.stringify({p_visitor_key:visitor,p_kind:"summary"})});
   }catch{console.warn("[kivai-video-summary] quota refund failed");}
  }
 }
}
