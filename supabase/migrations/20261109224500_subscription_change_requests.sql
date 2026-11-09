-- Solicitações de gestão de planos; não altera o Asaas nem o acesso do usuário.
create table if not exists public.kivai_subscription_change_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 subscription_id uuid not null references public.user_subscriptions(id),
 provider text not null,
 provider_subscription_id text,
 current_plan public.kivai_plan_code not null,
 current_billing_cycle text,
 action text not null check(action in ('cancel_renewal','upgrade','downgrade','change_cycle')),
 target_plan public.kivai_plan_code not null,
 target_cycle text,
 state text not null default 'pending_review'
  check(state in ('pending_review','processing','completed','rejected','canceled')),
 requested_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 processed_at timestamptz,
 last_error text
);
create unique index if not exists kivai_one_open_plan_change_per_user
 on public.kivai_subscription_change_requests(user_id)
 where state in ('pending_review','processing');
create index if not exists kivai_plan_change_review_queue
 on public.kivai_subscription_change_requests(requested_at)
 where state='pending_review';

alter table public.kivai_subscription_change_requests enable row level security;
revoke all on public.kivai_subscription_change_requests from public,anon,authenticated;
grant select,insert,update on public.kivai_subscription_change_requests to service_role;

create or replace function public.kivai_request_subscription_change(
 p_user_id uuid, p_action text, p_target_cycle text default null
) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
 v_sub public.user_subscriptions;
 v_existing public.kivai_subscription_change_requests;
 v_target public.kivai_plan_code;
 v_cycle text;
 v_new public.kivai_subscription_change_requests;
begin
 if p_user_id is null or p_action not in
 ('cancel_renewal','upgrade','downgrade','change_cycle')
 or (p_target_cycle is not null and p_target_cycle not in ('monthly','annual')) then
  raise exception 'Solicitação inválida';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,9913));
 select * into v_sub from public.user_subscriptions
  where user_id=p_user_id and status='active'
   and (current_period_end is null or current_period_end>now())
   and plan_code in ('pro','agency')
  order by updated_at desc,id desc limit 1 for update;
 if v_sub.id is null then raise exception 'Não há assinatura paga vigente'; end if;
 -- Não permite fila de duas mudanças simultâneas nem repetir um cancelamento.
 select * into v_existing from public.kivai_subscription_change_requests
  where user_id=p_user_id and state in ('pending_review','processing')
  order by requested_at desc limit 1;
 if v_existing.id is not null then
   return jsonb_build_object('id',v_existing.id,'state',v_existing.state,
    'action',v_existing.action,'existing',true);
 end if;
 if p_action='cancel_renewal' then
  v_target:='free'; v_cycle:=null;
 elsif p_action='upgrade' then
  if v_sub.plan_code<>'pro' then raise exception 'Upgrade indisponível'; end if;
  v_target:='agency';v_cycle:=v_sub.billing_cycle;
 elsif p_action='downgrade' then
  if v_sub.plan_code<>'agency' then raise exception 'Downgrade indisponível'; end if;
  v_target:='pro';v_cycle:=v_sub.billing_cycle;
 else
  if p_target_cycle is null or p_target_cycle=v_sub.billing_cycle then
   raise exception 'Nova periodicidade inválida'; end if;
  v_target:=v_sub.plan_code;v_cycle:=p_target_cycle;
 end if;
 if p_action<>'cancel_renewal' and v_cycle not in ('monthly','annual') then
  raise exception 'Periodicidade inválida para o plano'; end if;
 insert into public.kivai_subscription_change_requests(
  user_id,subscription_id,provider,provider_subscription_id,current_plan,
  current_billing_cycle,action,target_plan,target_cycle
 ) values (
  p_user_id,v_sub.id,coalesce(v_sub.provider,'unknown'),v_sub.provider_subscription_id,
  v_sub.plan_code,v_sub.billing_cycle,p_action,v_target,v_cycle
 ) returning * into v_new;
 return jsonb_build_object('id',v_new.id,'state',v_new.state,
  'action',v_new.action,'existing',false);
end;
$$;
revoke all on function public.kivai_request_subscription_change(uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.kivai_request_subscription_change(uuid,text,text)
 to service_role;
