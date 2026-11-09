import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
type ChangeAction="cancel_renewal"|"upgrade"|"downgrade"|"change_cycle";
type ChangeResult={id:string;state:string;action:ChangeAction;existing:boolean};
function fail(status:number,error:string) {
 return Response.json({error},{status,headers});
}
export async function POST(request:Request) {
 let userId:string;
 try {userId=(await authenticateBillingUser(request)).id;}
 catch{return fail(401,"Faça login para gerenciar seu plano.");}
 const body=await request.json().catch(()=>null) as {action?:unknown;targetCycle?:unknown}|null;
 const action=body?.action;
 const accepted=["cancel_renewal","upgrade","downgrade","change_cycle"];
 if(typeof action!=="string"||!accepted.includes(action) ||
   (action==="change_cycle" && !["monthly","annual"].includes(String(body?.targetCycle))) ||
   (action!=="change_cycle" && body?.targetCycle!=null)) {
   return fail(400,"Ação ou periodicidade inválida.");
 }
 try{
  const result=await supabaseRest<ChangeResult>("rpc/kivai_request_subscription_change",{
   method:"POST",
   body:JSON.stringify({
    p_user_id:userId,
    p_action:action,
    p_target_cycle:action==="change_cycle"?body?.targetCycle:null,
   }),
  });
  return Response.json({
    requestId:result.id,
    status:result.state,
    existing:result.existing,
    message:"Solicitação registrada para conferência. A cobrança recorrente ainda NÃO foi alterada nem cancelada.",
  },{status:202,headers});
 }catch{
  console.error("subscription_change_request_failed");
  return fail(409,"Não foi possível registrar sua solicitação. Consulte o atendimento.");
 }
}
