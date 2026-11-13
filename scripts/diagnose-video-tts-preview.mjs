// Temporary preview-only TTS smoke test. Logs only HTTP status and structural metadata.
if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/preview-transcricao-resumo-youtube-20261112")process.exit(0);
const key=process.env.GEMINI_API_KEY;if(!key)process.exit(0);
try{
 const r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{
 method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
 body:JSON.stringify({model:"gemini-3.8-flash-lite-tts",input:[{type:"user_input",content:[{type:"text",text:"Olá. Este é um teste de narração de um resumo no Kivai.",annotations:[{type:"speech_metadata",style:"Calmo e natural, em português brasileiro."}]}]}],response_format:{type:"audio"},generation_config:{speech_config:[{voice:"Kore"}]}}),signal:AbortSignal.timeout(35000)});
 const data=await r.json().catch(()=>({}));
 const audios=(data.steps??[]).filter(x=>x.type==="model_output").flatMap(x=>x.content??[]).filter(x=>x.type==="audio");
 console.log("[tts-diag]",r.status,"code",data.error?.status??"ok","audio-blocks",audios.length,"base64-length",audios[0]?.data?.length??0,"mime",audios[0]?.mime_type??"unknown");
}catch(err){console.log("[tts-diag] exception",err?.name??"unknown")}
