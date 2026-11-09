-- Promotion from a verified checkout to a payable Asaas subscription.
-- Must be called only after server verification against Asaas API.
-- Does not grant a plan; payment activation stays in kivai_apply_asaas_paid_charge.
create or replace function public.kivai_promote_asaas_verified_subscription(
 p_external_reference text,
 p_subscription_id text,
 p_customer_id text,
 p_amount_brl numeric,
 p_cycle text
) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
 v_intent public.kivai_asaas_checkout_intents;
 v_link public.kivai_recurring_provider_links;
begin
 if p_external_reference is null or p_external_reference !~ '^kivai_asaas_[0-9a-f-]{36}$'
    or p_subscription_id is null or length(p_subscription_id)<4
    or p_customer_id is null or length(p_customer_id)<4
    or p_amount_brl is null or p_amount_brl<=0
    or p_cycle not in ('MONTHLY','YEARLY') then
  raise exception 'Dados de assinatura inválidos';
 end if;
 select * into v_intent from public.kivai_asaas_checkout_intents
   where external_reference=p_external_reference for update;
 if v_intent.id is null
    or v_intent.state not in ('created','paid')
    or v_intent.provider_checkout_id is null
    or v_intent.checkout_paid_at is null
    or v_intent.subscription_verified_at is null
    or v_intent.provider_subscription_id is distinct from p_subscription_id
    or v_intent.expected_amount_brl is distinct from p_amount_brl
    or (case when v_intent.billing_cycle='annual' then 'YEARLY' else 'MONTHLY' end)<>p_cycle
 then
   return jsonb_build_object('linked',false,'reason','checkout_not_fully_verified');
 end if;
 perform pg_advisory_xact_lock(hashtextextended(v_intent.user_id::text, 4567));
 -- An earlier active non-Asaas plan must not be overwritten or double charged.
 if exists (
   select 1 from public.user_subscriptions s
     where s.user_id=v_intent.user_id and s.status='active'
       and (s.current_period_end is null or s.current_period_end>now())
       and (s.provider is distinct from 'asaas' or
          s.provider_subscription_id is distinct from p_subscription_id)
 ) then
   return jsonb_build_object('linked',false,'reason','existing_active_subscription');
 end if;
 if exists (
   select 1 from public.kivai_recurring_provider_links l
     where l.user_id=v_intent.user_id and l.state='active'
       and l.provider_subscription_id<>p_subscription_id
 ) then
   return jsonb_build_object('linked',false,'reason','different_active_provider_link');
 end if;
 select * into v_link from public.kivai_recurring_provider_links
   where provider_subscription_id=p_subscription_id for update;
 if v_link.id is not null then
   if v_link.user_id<>v_intent.user_id or v_link.plan_code<>v_intent.plan_code
      or v_link.billing_cycle<>v_intent.billing_cycle
      or v_link.expected_amount_brl<>v_intent.expected_amount_brl
      or v_link.provider_customer_id is distinct from p_customer_id then
     return jsonb_build_object('linked',false,'reason','provider_link_conflict');
   end if;
   return jsonb_build_object('linked',v_link.state='active','existing',true);
 end if;
 insert into public.kivai_recurring_provider_links(
   user_id,provider,provider_subscription_id,provider_customer_id,
   plan_code,billing_cycle,expected_amount_brl,state
 ) values (
   v_intent.user_id,'asaas',p_subscription_id,p_customer_id,
   v_intent.plan_code,v_intent.billing_cycle,v_intent.expected_amount_brl,'active'
 ) returning * into v_link;
 return jsonb_build_object('linked',true,'existing',false);
end;
$$;
revoke all on function public.kivai_promote_asaas_verified_subscription(text,text,text,numeric,text)
 from public,anon,authenticated;
grant execute on function public.kivai_promote_asaas_verified_subscription(text,text,text,numeric,text)
 to service_role;
