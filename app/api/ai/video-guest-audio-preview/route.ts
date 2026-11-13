import { supabaseRest } from "@/lib/blog/supabase";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 240;
const headers = {"Cache-Control":"private, no-store"};
const fail = (error:string,status=400)=>Response.json({error},{status,headers});
export async function POST(request:Request){
 if(process.env.VERCEL_ENV!=="preview")return fail("Disponível apenas na homologação.",404);
 try{
  const raw=await request.text();
  if(Buffer.byteLength(raw)>15000)return fail("Texto muito extenso.",413);
  const data=JSON.parse(raw) as {text?:unknown;consent?:unknown};
  const text=typeof data.text==="string"?data.text.trim():"";
  if(data.consent!==true||!text||text.length>8000)return fail("O resumo deve ter até 8.000 caracteres e autorização para narração.");
  const ip=request.headers.get("x-real-ip")||request.headers.get("x-vercel-forwarded-for")?.split(",")[0]||"unknown";
  const key=createHash("sha256").update(`${process.env.ADMIN_AUTH_SECRET??"preview"}:guest-audio:${ip}`).digest("hex");
  // Operational anti-abuse ceiling for publicly accessible preview; no login or plan entitlement.
  const approved=await supabaseRest<boolean>("rpc/reserve_ai_video_preview",{
   method:"POST",body:JSON.stringify({p_client_key:key})
  });
  if(!approved)return fail("A capacidade de segurança desta prévia foi atingida hoje.",429);
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return fail("Gemini não configurado neste ambiente.",503);
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
   method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
   cache:"no-store",signal:AbortSignal.timeout(180000),
   body:JSON.stringify({
    model:"gemini-3.8-flash-lite-tts",
    input:[{type:"user_input",content:[{type:"text",text,annotations:[{type:"speech_metadata",style:"Narre naturalmente em português brasileiro, com boa dicção e ritmo claro."}]}]}],
    response_format:{type:"audio"},generation_config:{speech_config:[{voice:"Kore"}]}
   })
  });
  if(!r.ok){console.warn("[video-guest-audio] Gemini status",r.status);return fail(r.status===429?"Gemini atingiu seu limite temporário.":"Não foi possível gerar a narração.",r.status===429?429:503);}
  const output=await r.json() as {steps?:Array<{type?:string;content?:Array<{type?:string;data?:string}>}>};
  const encoded=output.steps?.filter(x=>x.type==="model_output").flatMap(x=>x.content??[]).find(x=>x.type==="audio")?.data;
  if(!encoded)return fail("A IA não retornou áudio.",503);
  const audio=Buffer.from(encoded,"base64");
  if(audio.length<44||audio.toString("ascii",0,4)!=="RIFF"||audio.length>30000000)return fail("Formato de áudio inesperado.",503);
  return new Response(audio,{status:200,headers:{"Content-Type":"audio/wav","Cache-Control":"private, no-store","Content-Disposition":"inline"}});
 }catch(error){
  console.warn("[video-guest-audio]",error instanceof Error?error.name:"error");
  return fail("Não foi possível gerar o áudio nesta tentativa.",503);
 }
}
