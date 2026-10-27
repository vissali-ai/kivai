import {authenticateBillingUser} from "@/lib/billing/sumup";
import {isAdminAuthenticated} from "@/lib/blog/auth";
import {supabaseRest,supabaseStorage} from "@/lib/blog/supabase";
import {isUuid,privateHeaders,supportError} from "@/lib/support/service";
export const runtime="nodejs";
type Ctx={params:Promise<{id:string}>};
type Attachment={id:string;ticket_id:string;object_path:string;file_name:string;mime_type:string;user_id:string};
export async function GET(req:Request,{params}:Ctx){
 try{
  const {id}=await params;
  if(!isUuid(id))throw new Error("TICKET_NOT_FOUND");
  const rows=await supabaseRest<Attachment[]>(`support_attachments?select=id,ticket_id,object_path,file_name,mime_type,support_tickets!inner(user_id)&id=eq.${id}&limit=1`);
  const a=rows[0] as Attachment & {support_tickets?:{user_id:string}};
  if(!a)throw new Error("TICKET_NOT_FOUND");
  const admin=await isAdminAuthenticated();
  if(!admin){const user=await authenticateBillingUser(req);if(a.support_tickets?.user_id!==user.id)throw new Error("TICKET_NOT_FOUND")}
  const response=await supabaseStorage(`object/authenticated/support-attachments/${a.object_path}`,{method:"GET"});
  const content=await response.arrayBuffer();
  return new Response(content,{headers:{...privateHeaders,"Content-Type":a.mime_type,"Content-Length":String(content.byteLength),"Content-Disposition":`attachment; filename="imagem-${a.id.slice(0,8)}.${a.mime_type.split("/")[1]==="jpeg"?"jpg":a.mime_type.split("/")[1]}"`,"X-Content-Type-Options":"nosniff"}});
 }catch(e){return supportError(e)}
}
