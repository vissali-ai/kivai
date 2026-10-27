import {assertAdminApi} from "@/lib/blog/auth";
import {supabaseRest} from "@/lib/blog/supabase";
import {privateHeaders,supportError,statuses,type SupportTicket} from "@/lib/support/service";
export async function GET(req:Request){
 try{
  await assertAdminApi();
  const query=new URL(req.url).searchParams, status=query.get("status")??"todos";
  if(status!=="todos"&&!statuses.includes(status as typeof statuses[number]))throw new Error("INVALID_INPUT");
  const clause=status==="todos"?"":`&status=eq.${status}`;
  const tickets=await supabaseRest<SupportTicket[]>(`support_tickets?select=*${clause}&order=updated_at.desc&limit=200`);
  return Response.json({tickets},{headers:privateHeaders});
 }catch(e){return supportError(e)}
}
