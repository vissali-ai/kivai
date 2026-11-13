import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
function mac(payload:string){
 const key=process.env.ADMIN_AUTH_SECRET;
 if(!key)throw new Error("AUDIO_SIGNING_UNAVAILABLE");
 return createHmac("sha256",key).update("kivai-study-audio:"+payload).digest("hex");
}
export function signAudio(hash:string){
 const expires=Date.now()+60*60*1000;
 const sig=mac(expires+":"+hash);
 return expires+"."+sig;
}
export function verifyAudio(hash:string,token:string){
 const [time,signature]=token.split(".");
 const exp=Number(time);
 if(!/^\d{13}$/.test(time||"")||!Number.isFinite(exp)||exp<Date.now()||exp>Date.now()+3600000||!/^[a-f0-9]{64}$/.test(signature||"")||!/^[a-f0-9]{64}$/.test(hash))return false;
 const expected=Buffer.from(mac(time+":"+hash),"hex");
 const supplied=Buffer.from(signature,"hex");
 return timingSafeEqual(expected,supplied);
}
