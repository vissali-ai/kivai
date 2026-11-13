import { createHash } from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";

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
 const ip=request.headers.get("x-vercel-forwarded-for")?.split(",")[0]||request.headers.get("x-real-ip");
 if(!salt||!ip)throw new Error("VISITOR_CHECK_UNAVAILABLE");
 return createHash("sha256").update(salt+":video-studies-free:"+ip).digest("hex");
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
 let visitor:string|null=null;
 let reserved=false;
 let completed=false;
 try{
  const maxSeconds=3600;
  try{await checkDuration(youtube.videoId,maxSeconds);}
  catch(error){
   if(error instanceof Error&&error.message==="VIDEO_TOO_LONG")return fail("O vídeo deve ter até 60 minutos para gerar o resumo.",422);
   if(error instanceof Error&&error.message==="VIDEO_DURATION_UNKNOWN")return fail("Não foi possível identificar a duração do vídeo. Escolha outro vídeo público.",422);
   return fail("Não foi possível verificar a duração do vídeo. Tente novamente.",503);
  }
  visitor=visitorHash(request);
  reserved=await supabaseRest<boolean>("rpc/kivai_reserve_free_video_request",{
   method:"POST",body:JSON.stringify({p_fingerprint:visitor,p_kind:"summary"})
  });
  if(!reserved)return fail("O serviço está muito movimentado agora. Tente novamente mais tarde.",429);
  const instruction="Analise este vídeo público do YouTube. Em português brasileiro, escreva um título claro, um resumo fiel em até cinco parágrafos e de cinco a dez tópicos principais. Inclua tempos [mm:ss] apenas quando puder verificá-los. Não invente afirmações ou tempos. Se o vídeo estiver inacessível, informe a limitação em vez de criar conteúdo fictício. Responda diretamente com o resumo.";
  const requestBody=JSON.stringify({model:"gemini-3.5-flash-lite",input:[{type:"text",text:instruction},{type:"video",uri:youtube.url}]});
  let response:Response|null=null;
  for(let attempt=1;attempt<=3;attempt++){
   try{
    response=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
     method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
     cache:"no-store",signal:AbortSignal.timeout(180000),body:requestBody
    });
   }catch(error){
    console.warn("[kivai-video-summary] provider network failure",attempt,error instanceof Error?error.name:"unknown");
    if(attempt===3)throw error;
   }
   if(response?.ok)break;
   const status=response?.status??503;
   console.warn("[kivai-video-summary] provider HTTP",status,"attempt",attempt);
   if(status===429)return fail("O serviço está com muitas solicitações agora. Tente novamente em alguns instantes.",429);
   if(status!==503&&status!==502&&status!==504)return fail("Não foi possível concluir o resumo agora. Tente novamente.",503);
   if(attempt<3)await new Promise(resolve=>setTimeout(resolve,700*attempt));
  }
  if(!response?.ok)return fail("O serviço de resumo está temporariamente instável. Tente novamente em instantes.",503);
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
  if(reserved&&!completed&&visitor){
   try{
    await supabaseRest("rpc/kivai_refund_free_video_request",{
     method:"POST",body:JSON.stringify({p_fingerprint:visitor,p_kind:"summary"})
    });
   }catch{console.warn("[kivai-video-summary] quota refund failed");}
  }
 }
}
