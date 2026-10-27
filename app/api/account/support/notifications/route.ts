import {authenticateBillingUser} from "@/lib/billing/sumup";
import {supabaseRest} from "@/lib/blog/supabase";
import {isUuid,privateHeaders,readBody,sameOrigin,supportError,type SupportNotification} from "@/lib/support/service";
export async function GET(req:Request){
 try{
  const user=await authenticateBillingUser(req);
  const notices=await supabaseRest<SupportNotification[]>(`support_notifications?select=id,ticket_id,kind,title,read_at,created_at&user_id=eq.${user.id}&order=created_at.desc&limit=50`);
  return Response.json({notifications:notices,unread:notices.filter(n=>!n.read_at).length},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
export async function PATCH(req:Request){
 try{
  if(!sameOrigin(req))return Response.json({error:"Origem inválida."},{status:403});
  const user=await authenticateBillingUser(req),data=await readBody(req,3000);
  const ids=data.ids;
  if(data.all!==true&&(!Array.isArray(ids)||ids.length>50||!ids.every(isUuid)))throw new Error("INVALID_INPUT");
  const part=data.all===true?"":`&id=in.(${(ids as string[]).join(",")})`;
  await supabaseRest(`support_notifications?user_id=eq.${user.id}&read_at=is.null${part}`,{
   method:"PATCH",body:JSON.stringify({read_at:new Date().toISOString()})
  });
  return Response.json({ok:true},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
