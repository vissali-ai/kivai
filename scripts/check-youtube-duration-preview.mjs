// Preview-only credential check. Does not print secrets, full URL or response body.
if(process.env.VERCEL_ENV!=="preview") process.exit(0);
const key=process.env.YOUTUBE_DATA_API_KEY;
if(!key){console.log("[youtube-duration] missing preview key");process.exit(0);}
const id="dQw4w9WgXcQ";
try{
 const result=await fetch("https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id="+id+"&key="+encodeURIComponent(key),{signal:AbortSignal.timeout(12000),cache:"no-store"});
 const data=await result.json().catch(()=>({}));
 const duration=data.items?.[0]?.contentDetails?.duration;
 const match=duration&&/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
 const seconds=match?Number(match[1]||0)*86400+Number(match[2]||0)*3600+Number(match[3]||0)*60+Number(match[4]||0):null;
 console.log("[youtube-duration] HTTP",result.status,"video-found",data.items?.length===1,"duration-seconds",seconds??"unavailable","error-code",data.error?.code??"none");
}catch(error){console.log("[youtube-duration] request-error",error?.name??"unknown");}
