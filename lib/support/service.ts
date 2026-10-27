import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import { sendKivaiEmail } from "@/lib/email/resend";

export type SupportStatus = "aberto"|"em_atendimento"|"aguardando_usuario"|"resolvido"|"encerrado";
export type SupportTicket = {
 id:string; protocol:string; user_id:string; user_email:string; user_name:string|null;
 category:string; title:string; status:SupportStatus; priority:string;
 source_url:string|null; browser_info:string|null; internal_note:string|null;
 created_at:string; updated_at:string;
};
export type SupportMessage = {id:string;ticket_id:string;author_type:"usuario"|"admin";body:string;created_at:string};
export type SupportAttachment = {id:string;ticket_id:string;message_id:string;file_name:string;mime_type:string;size_bytes:number};
export type SupportNotification = {id:string;ticket_id:string;kind:string;title:string;read_at:string|null;created_at:string};
export const privateHeaders = {"Cache-Control":"private, no-store"};
export const categories = ["erro","duvida","financeiro","sugestao","outros"] as const;
export const statuses = ["aberto","em_atendimento","aguardando_usuario","resolvido","encerrado"] as const;
export const priorities = ["baixa","normal","alta"] as const;
export const isUuid = (s:unknown):s is string => typeof s==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export function sameOrigin(req:Request) {
 const origin=req.headers.get("origin");
 if (!origin) return true;
 try{return new URL(origin).host===new URL(req.url).host;}catch{return false;}
}
export function cleanText(input:unknown,min=2,max=3000) {
 const value=typeof input==="string"?input.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim():"";
 return value.length>=min&&value.length<=max?value:null;
}
export function supportError(err:unknown) {
 const e=err instanceof Error?err.message:"";
 const unauthorized=e==="UNAUTHORIZED", missing=e==="TICKET_NOT_FOUND",invalid=e==="INVALID_INPUT",
   limited=e==="RATE_LIMITED",locked=e==="TICKET_CLOSED";
 if(!unauthorized&&!missing&&!invalid&&!limited&&!locked) console.error("[support] Error",err);
 return Response.json({error:unauthorized?"Faça login para continuar.":missing?"Protocolo não encontrado.":invalid?"Verifique os dados informados.":limited?"Limite de solicitações atingido. Tente novamente mais tarde.":locked?"Este protocolo está encerrado. Reabra para responder.":"Não foi possível concluir a operação."},
  {status:unauthorized?401:missing?404:invalid?400:limited?429:locked?409:503,headers:privateHeaders});
}
export function userTicket(ticket:SupportTicket) {
 const {id,protocol,category,title,status,created_at,updated_at,source_url}=ticket;
 return {id,protocol,category,title,status,created_at,updated_at,source_url};
}
export async function fetchTicket(id:string,userId?:string) {
 if(!isUuid(id)) throw new Error("TICKET_NOT_FOUND");
 const clause=userId?`&user_id=eq.${encodeURIComponent(userId)}`:"";
 const rows=await supabaseRest<SupportTicket[]>(`support_tickets?select=*&id=eq.${id}${clause}&limit=1`);
 if(!rows[0])throw new Error("TICKET_NOT_FOUND");
 return rows[0];
}
export async function fetchConversation(ticketId:string) {
 const [messages,attachments]=await Promise.all([
  supabaseRest<SupportMessage[]>(`support_messages?select=id,ticket_id,author_type,body,created_at&ticket_id=eq.${ticketId}&order=created_at.asc&limit=500`),
  supabaseRest<SupportAttachment[]>(`support_attachments?select=id,ticket_id,message_id,file_name,mime_type,size_bytes&ticket_id=eq.${ticketId}&order=created_at.asc&limit=200`)
 ]);
 return {messages,attachments};
}
export async function logMessage(ticketId:string,author:"usuario"|"admin",body:string,userId?:string) {
 const rows=await supabaseRest<SupportMessage[]>("support_messages",{
  method:"POST",body:JSON.stringify({ticket_id:ticketId,author_type:author,author_user_id:author==="usuario"?userId:null,body})
 });
 if(!rows[0])throw new Error("MESSAGE_CREATE_FAILED");
 return rows[0];
}
export async function notifyEmail(to:string|undefined,subject:string,body:string) {
 if(!to)return;
 try{await sendKivaiEmail({to,subject,text:body});}
 catch(e){console.error("[support] E-mail de notificação não enviado",e);}
}
export async function readBody(request:Request,max=16000):Promise<Record<string,unknown>> {
 if(!(request.headers.get("content-type")??"").includes("application/json"))throw new Error("INVALID_INPUT");
 const raw=await request.text();
 if(new TextEncoder().encode(raw).length>max)throw new Error("INVALID_INPUT");
 let data:unknown;try{data=JSON.parse(raw)}catch{throw new Error("INVALID_INPUT")}
 if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("INVALID_INPUT");
 return data as Record<string,unknown>;
}
