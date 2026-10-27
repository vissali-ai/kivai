import {authenticateBillingUser} from "@/lib/billing/sumup";
import {supabaseRest} from "@/lib/blog/supabase";
import {cleanText,fetchConversation,fetchTicket,logMessage,privateHeaders,readBody,sameOrigin,supportError,userTicket} from "@/lib/support/service";
type Ctx={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Ctx) {
 try{
  const user=await authenticateBillingUser(request),{id}=await params;
  const ticket=await fetchTicket(id,user.id),conversation=await fetchConversation(ticket.id);
  return Response.json({ticket:userTicket(ticket),...conversation},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
export async function POST(request:Request,{params}:Ctx) {
 try{
  if(!sameOrigin(request))return Response.json({error:"Origem inválida."},{status:403});
  const user=await authenticateBillingUser(request),{id}=await params,data=await readBody(request);
  const ticket=await fetchTicket(id,user.id);
  if(data.action==="reopen"){
   if(ticket.status!=="resolvido"&&ticket.status!=="encerrado")throw new Error("INVALID_INPUT");
   await supabaseRest(`support_tickets?id=eq.${id}&user_id=eq.${user.id}`,{method:"PATCH",body:JSON.stringify({status:"aberto",updated_at:new Date().toISOString()})});
   return Response.json({ok:true},{headers:privateHeaders});
  }
  const message=cleanText(data.message,2,3000);
  if(!message)throw new Error("INVALID_INPUT");
  if(ticket.status==="encerrado"||ticket.status==="resolvido")throw new Error("TICKET_CLOSED");
  const created=await logMessage(ticket.id,"usuario",message,user.id);
  if(ticket.status==="aguardando_usuario")await supabaseRest(`support_tickets?id=eq.${id}`,{method:"PATCH",body:JSON.stringify({status:"aberto"})});
  await import("@/lib/support/service").then(x=>x.notifyEmail("contato@kivai.com.br",`[Kivai] Resposta no chamado ${ticket.protocol}`,`O usuário respondeu ao chamado ${ticket.protocol}.\n\n${message}\n\nhttps://kivai.com.br/admin/atendimento?ticket=${id}`));
  return Response.json({message:created},{status:201,headers:privateHeaders});
 }catch(e){return supportError(e)}
}
