if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/preview-transcricao-resumo-youtube-20261112")process.exit(0);
const key=process.env.YOUTUBE_DATA_API_KEY??process.env.GEMINI_API_KEY;
const id="9hE5-98ZeCg";
if(key){
 try{const r=await fetch("https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id="+id+"&key="+encodeURIComponent(key),{signal:AbortSignal.timeout(10000),cache:"no-store"});const data=await r.json().catch(()=>({}));console.log("[duration-diag] youtube-api",r.status,"items",data.items?.length??0,"duration",data.items?.[0]?.contentDetails?.duration??"unknown","code",data.error?.status??"none");}catch(e){console.log("[duration-diag] youtube-api error",e?.name??"unknown")}
}
try{const r=await fetch("https://www.youtube.com/watch?v="+id,{headers:{"User-Agent":"Mozilla/5.0 (compatible; KivaiPreview/1.0)"},signal:AbortSignal.timeout(10000)});const html=await r.text();console.log("[duration-diag] youtube-watch",r.status,"length",html.length,"matches",/\\"lengthSeconds\\":\\"(\d+)\\"/.test(html));}catch(e){console.log("[duration-diag] youtube-watch error",e?.name??"unknown")}
