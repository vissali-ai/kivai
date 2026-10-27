import {authenticateBillingUser} from "@/lib/billing/sumup";
import {supabaseRest} from "@/lib/blog/supabase";
import {categories,cleanText,logMessage,notifyEmail,privateHeaders,readBody,sameOrigin,supportError,type SupportTicket,userTicket} from "@/lib/support/service";
export async function GET(request:Request) {
 try{
  const user=await authenticateBillingUser(request);
  const list=await supabaseRest<SupportTicket[]>(`support_tickets?select=*&user_id=eq.${encodeURIComponent(user.id)}&order=updated_at.desc&limit=100`);
  return Response.json({tickets:list.map(userTicket)},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
export async function POST(request:Request) {
 try{
  if(!sameOrigin(request))return Response.json({error:"Origem inválida."},{status:403});
  const user=await authenticateBillingUser(request),data=await readBody(request);
  const category=data.category,title=cleanText(data.title,5,140),message=cleanText(data.message,10,3000);
  if(!categories.includes(category as typeof categories[number])||!title||!message)throw new Error("INVALID_INPUT");
  const recent=await supabaseRest<Array<{id:string}>>(`support_tickets?select=id&user_id=eq.${user.id}&created_at=gte.${encodeURIComponent(new Date(Date.now()-3600000).toISOString())}&limit=5`);
  if(recent.length>=5)throw new Error("RATE_LIMITED");
  const source=typeof data.sourceUrl==="string"&&/^\/(?!\/)[^\r\n]{0,450}$/.test(data.sourceUrl)?data.sourceUrl:null;
  const browser=typeof data.browser==="string"?data.browser.slice(0,350):null;
  const name=typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name.slice(0,120):null;
  const rows=await supabaseRest<SupportTicket[]>("support_tickets",{method:"POST",body:JSON.stringify({
   user_id:user.id,user_email:user.email??"",user_name:name,category,title,source_url:source,browser_info:browser
  })});
  const ticket=rows[0];if(!ticket)throw new Error("TICKET_CREATE_FAILED");
  try {await logMessage(ticket.id,"usuario",message,user.id)}
  catch(e){await supabaseRest(`support_tickets?id=eq.${ticket.id}&user_id=eq.${user.id}`,{method:"DELETE"});throw e;}
  void 0;
  await notifyEmail("contato@kivai.com.br",`[Kivai] Novo chamado ${ticket.protocol}`,
   `Novo chamado: ${ticket.title}\nDe: ${ticket.user_email}\nProtocolo: ${ticket.protocol}\n\n${message}\n\nhttps://kivai.com.br/admin/atendimento?ticket=${ticket.id}`);
  return Response.json({ticket:userTicket(ticket)},{status:201,headers:privateHeaders});
 }catch(e){return supportError(e)}
}
