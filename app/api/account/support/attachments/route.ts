import {authenticateBillingUser} from "@/lib/billing/sumup";
import {supabaseRest,supabaseStorage} from "@/lib/blog/supabase";
import {fetchTicket,isUuid,privateHeaders,sameOrigin,supportError,type SupportAttachment} from "@/lib/support/service";
export const runtime="nodejs";
const MAX_FILE=5242880;
function detectMime(bytes:Uint8Array){
 if(bytes.length>8 && bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71) return {mime:"image/png",ext:"png"};
 if(bytes.length>3 && bytes[0]===255&&bytes[1]===216&&bytes[2]===255) return {mime:"image/jpeg",ext:"jpg"};
 if(bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return {mime:"image/webp",ext:"webp"};
 return null;
}
export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return Response.json({error:"Origem inválida."},{status:403});
  const user=await authenticateBillingUser(request);
  const declared=Number(request.headers.get("content-length")??0);
  if(declared>MAX_FILE+30000)throw new Error("INVALID_INPUT");
  const form=await request.formData(),ticketId=form.get("ticketId"),messageId=form.get("messageId"),file=form.get("file");
  if(!isUuid(ticketId)||!isUuid(messageId)||!(file instanceof File)||file.size<1||file.size>MAX_FILE)throw new Error("INVALID_INPUT");
  const ticket=await fetchTicket(ticketId,user.id);
  if(ticket.status==="encerrado")throw new Error("TICKET_CLOSED");
  const message=await supabaseRest<Array<{id:string}>>(`support_messages?select=id&id=eq.${messageId}&ticket_id=eq.${ticketId}&author_type=eq.usuario&author_user_id=eq.${user.id}&limit=1`);
  if(!message.length)throw new Error("TICKET_NOT_FOUND");
  const other=await supabaseRest<Array<{id:string}>>(`support_attachments?select=id&message_id=eq.${messageId}&limit=3`);
  if(other.length>=3)throw new Error("RATE_LIMITED");
  const bytes=new Uint8Array(await file.arrayBuffer()),format=detectMime(bytes);
  if(!format||file.type!==format.mime)throw new Error("INVALID_INPUT");
  const fileName=file.name.replace(/[^\p{L}\p{N}._ -]/gu,"").slice(0,120)||`imagem.${format.ext}`;
  const path=`${ticketId}/${crypto.randomUUID()}.${format.ext}`;
  await supabaseStorage(`object/support-attachments/${path}`,{
   method:"POST",headers:{"Content-Type":format.mime,"x-upsert":"false"},body:Buffer.from(bytes)
  });
  try {
   const rows=await supabaseRest<SupportAttachment[]>("support_attachments",{
    method:"POST",body:JSON.stringify({ticket_id:ticketId,message_id:messageId,file_name:fileName,object_path:path,mime_type:format.mime,size_bytes:file.size})
   });
   return Response.json({attachment:rows[0]},{status:201,headers:privateHeaders});
  } catch(err){
   await supabaseStorage(`object/support-attachments/${path}`,{method:"DELETE"}).catch(()=>undefined);
   throw err;
  }
 }catch(e){return supportError(e)}
}
