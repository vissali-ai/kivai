import {assertAdminApi} from "@/lib/blog/auth";
import {supabaseRest} from "@/lib/blog/supabase";
import {cleanText,fetchConversation,fetchTicket,logMessage,notifyEmail,privateHeaders,priorities,readBody,sameOrigin,statuses,supportError} from "@/lib/support/service";
type Ctx={params:Promise<{id:string}>};
export async function GET(_req:Request,{params}:Ctx){
 try{await assertAdminApi();const {id}=await params;const ticket=await fetchTicket(id);
 return Response.json({ticket,...await fetchConversation(id)},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
export async function POST(req:Request,{params}:Ctx){
 try{
  if(!sameOrigin(req))return Response.json({error:"Origem inválida."},{status:403});
  await assertAdminApi();const {id}=await params,ticket=await fetchTicket(id),data=await readBody(req);
  const body=cleanText(data.message,2,3000);if(!body)throw new Error("INVALID_INPUT");
  const msg=await logMessage(id,"admin",body);
  await notifyEmail(ticket.user_email,`[Kivai] Nova resposta - ${ticket.protocol}`,
   `Sua solicitação recebeu uma resposta.\nProtocolo: ${ticket.protocol}\n\n${body}\n\nAcompanhe: https://kivai.com.br/conta/atendimento?ticket=${id}`);
  return Response.json({message:msg},{status:201,headers:privateHeaders});
 }catch(e){return supportError(e)}
}
export async function PATCH(req:Request,{params}:Ctx){
 try{
  if(!sameOrigin(req))return Response.json({error:"Origem inválida."},{status:403});
  await assertAdminApi();const {id}=await params,ticket=await fetchTicket(id),data=await readBody(req);
  const update:Record<string,unknown>={updated_at:new Date().toISOString()};
  if(data.status!==undefined){if(!statuses.includes(data.status as typeof statuses[number]))throw new Error("INVALID_INPUT");update.status=data.status;}
  if(data.priority!==undefined){if(!priorities.includes(data.priority as typeof priorities[number]))throw new Error("INVALID_INPUT");update.priority=data.priority;}
  if(data.internal_note!==undefined){const note=data.internal_note;if(typeof note!=="string"||note.length>2500)throw new Error("INVALID_INPUT");update.internal_note=note.trim()||null;}
  if(Object.keys(update).length===1)throw new Error("INVALID_INPUT");
  await supabaseRest(`support_tickets?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(update)});
  if(update.status==="resolvido"&&ticket.status!=="resolvido"){
   await notifyEmail(ticket.user_email,`[Kivai] Chamado resolvido - ${ticket.protocol}`,
    `Seu protocolo ${ticket.protocol} foi marcado como resolvido.\n\nAcompanhe ou reabra em: https://kivai.com.br/conta/atendimento?ticket=${id}`);
  }
  return Response.json({ok:true},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
