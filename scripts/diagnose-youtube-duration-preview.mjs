if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/preview-transcricao-resumo-youtube-20261112")process.exit(0);
try{
 const id="9hE5-98ZeCg";
 const r=await fetch("https://www.youtube.com/watch?v="+id,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(10000)});
 const html=await r.text();
 const start=html.indexOf('"videoDetails"');
 const chunk=start>=0?html.slice(start,start+14000):"";
 const sec=chunk.match(/"lengthSeconds":"(\\d+)"/)?.[1]??chunk.match(/\\\\"lengthSeconds\\\\":\\\\"(\\d+)\\\\"/)?.[1];
 const idFound=chunk.includes(id);
 console.log("[duration-diag] youtube-watch",r.status,"details",start>=0,"id-match",idFound,"seconds",sec??"unknown");
}catch(e){console.log("[duration-diag] youtube-watch exception",e?.name??"unknown")}
