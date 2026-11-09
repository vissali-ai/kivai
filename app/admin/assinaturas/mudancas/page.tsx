import Link from "next/link";
import { requireAdmin } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";

export const dynamic="force-dynamic";
type ChangeRequest={
  id:string;
  user_id:string;
  provider:string;
  current_plan:string;
  current_billing_cycle:string|null;
  action:"cancel_renewal"|"upgrade"|"downgrade"|"change_cycle";
  target_plan:string;
  target_cycle:string|null;
  state:string;
  requested_at:string;
};
const labels={
 cancel_renewal:"Cancelar renovação",
 upgrade:"Upgrade",
 downgrade:"Downgrade",
 change_cycle:"Alterar periodicidade",
};
export default async function AdminSubscriptionChangeRequests() {
  await requireAdmin();
  const requests=await supabaseRest<ChangeRequest[]>(
    "kivai_subscription_change_requests?select=id,user_id,provider,current_plan,current_billing_cycle,action,target_plan,target_cycle,state,requested_at&order=requested_at.desc&limit=100"
  );
  return <div className="space-y-6">
    <header className="space-y-3">
      <Link href="/admin/assinaturas" className="text-sm text-primary underline">Voltar para assinaturas</Link>
      <h1 className="text-3xl font-semibold">Solicitações de mudanças de plano</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Solicitações registradas pelos assinantes. A solicitação NÃO cancela, não altera a recorrência no Asaas ou InfinitePay e não modifica o plano do usuário. Antes de concluir, é obrigatório conferir a operação no provedor financeiro.</p>
    </header>
    <div className="border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Aguardando análise: {requests.filter(x=>x.state==="pending_review").length}</h2>
      {requests.length===0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma solicitação registrada.</p> :
      <ul className="mt-4 divide-y divide-border">
        {requests.map(request=><li key={request.id} className="space-y-1 py-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-semibold">{labels[request.action]} · {request.state==="pending_review"?"Aguardando análise":request.state}</p>
            <time className="text-muted-foreground">{new Date(request.requested_at).toLocaleString("pt-BR")}</time>
          </div>
          <p>Atual: {request.current_plan} · Destino: {request.target_plan}{request.target_cycle ? ` (${request.target_cycle})` : ""}</p>
          <p className="break-all text-muted-foreground">Conta: {request.user_id} · Cobrança: {request.provider}</p>
        </li>)}
      </ul>}
    </div>
  </div>;
}
