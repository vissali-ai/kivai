-- Asaas Sandbox lifecycle events are audit-only, never grant entitlements.
-- No sandbox IDs are inserted into production provider links or subscriptions.
alter table public.kivai_asaas_checkout_intents
  add column if not exists checkout_paid_at timestamptz,
  add column if not exists subscription_verified_at timestamptz;

create table if not exists public.kivai_asaas_lifecycle_events (
  provider_event_id text primary key,
  event_type text not null check(event_type in
    ('CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED','SUBSCRIPTION_CREATED')),
  provider_resource_id text not null,
  processing_status text not null default 'recorded'
    check(processing_status in ('recorded','verified','manual_review','duplicate')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
alter table public.kivai_asaas_lifecycle_events enable row level security;
revoke all on public.kivai_asaas_lifecycle_events from public,anon,authenticated;
grant select,insert,update on public.kivai_asaas_lifecycle_events to service_role;

create or replace function public.kivai_record_asaas_checkout_lifecycle(
 p_event_id text, p_checkout_id text, p_event_type text
) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_status text;
begin
 if p_event_id is null or length(p_event_id)<5 or length(p_event_id)>160
   or p_checkout_id is null or length(p_checkout_id)<4 or length(p_checkout_id)>120
   or p_event_type not in ('CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED')
 then raise exception 'Evento de checkout inválido'; end if;
 insert into public.kivai_asaas_lifecycle_events(provider_event_id,event_type,provider_resource_id)
 values(p_event_id,p_event_type,p_checkout_id)
 on conflict(provider_event_id) do nothing;
 if not found then return jsonb_build_object('recorded',false,'reason','duplicate'); end if;
 select id into v_id from public.kivai_asaas_checkout_intents
 where provider_checkout_id=p_checkout_id and state in ('created','paid') for update;
 if v_id is null then
  update public.kivai_asaas_lifecycle_events set processing_status='manual_review'
    where provider_event_id=p_event_id;
  return jsonb_build_object('recorded',true,'linked',false,'reason','unknown_checkout');
 end if;
 if p_event_type='CHECKOUT_PAID' then
  update public.kivai_asaas_checkout_intents
    set checkout_paid_at=coalesce(checkout_paid_at,now()),updated_at=now()
    where id=v_id;
 elsif p_event_type in ('CHECKOUT_CANCELED','CHECKOUT_EXPIRED') then
  update public.kivai_asaas_checkout_intents
    set state=case when p_event_type='CHECKOUT_CANCELED' then 'canceled' else 'expired' end, updated_at=now()
    where id=v_id and checkout_paid_at is null and provider_subscription_id is null;
 end if;
 update public.kivai_asaas_lifecycle_events set processing_status='verified',verified_at=now()
  where provider_event_id=p_event_id;
 return jsonb_build_object('recorded',true,'linked',true);
end;
$$;
revoke all on function public.kivai_record_asaas_checkout_lifecycle(text,text,text)
 from public,anon,authenticated;
grant execute on function public.kivai_record_asaas_checkout_lifecycle(text,text,text)
 to service_role;

-- Store a verified subscription candidate against exactly one checkout intent.
-- The caller MUST independently GET /subscriptions/{id} before this RPC.
-- A nullable externalReference is intentionally NOT guessed by email, amount, or chronology.
create or replace function public.kivai_record_asaas_subscription_candidate(
 p_event_id text, p_subscription_id text, p_external_reference text,
 p_customer_id text, p_amount_brl numeric, p_cycle text
) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_row public.kivai_asaas_checkout_intents;
begin
 if p_event_id is null or length(p_event_id)<5 or length(p_event_id)>160
   or p_subscription_id is null or length(p_subscription_id)<4 or length(p_subscription_id)>120
   or p_customer_id is null or length(p_customer_id)<4
   or p_external_reference is null or length(p_external_reference)<8
   or p_amount_brl is null or p_amount_brl<=0 or p_cycle not in ('MONTHLY','YEARLY')
 then raise exception 'Assinatura não conciliável'; end if;
 insert into public.kivai_asaas_lifecycle_events(provider_event_id,event_type,provider_resource_id)
 values(p_event_id,'SUBSCRIPTION_CREATED',p_subscription_id)
 on conflict(provider_event_id) do nothing;
 if not found then return jsonb_build_object('recorded',false,'reason','duplicate'); end if;
 select * into v_row from public.kivai_asaas_checkout_intents
   where external_reference=p_external_reference and provider_checkout_id is not null
     and state in ('created','paid') for update;
 if v_row.id is null
   or v_row.expected_amount_brl is distinct from p_amount_brl
   or (case when v_row.billing_cycle='annual' then 'YEARLY' else 'MONTHLY' end)<>p_cycle
   or (v_row.provider_subscription_id is not null and v_row.provider_subscription_id<>p_subscription_id)
 then
  update public.kivai_asaas_lifecycle_events set processing_status='manual_review'
    where provider_event_id=p_event_id;
  return jsonb_build_object('recorded',true,'linked',false,'reason','mismatch');
 end if;
 update public.kivai_asaas_checkout_intents
  set provider_subscription_id=p_subscription_id,subscription_verified_at=now(),updated_at=now()
  where id=v_row.id;
 update public.kivai_asaas_lifecycle_events set processing_status='verified',verified_at=now()
  where provider_event_id=p_event_id;
 return jsonb_build_object('recorded',true,'linked',true);
end;
$$;
revoke all on function public.kivai_record_asaas_subscription_candidate(text,text,text,text,numeric,text)
 from public,anon,authenticated;
grant execute on function public.kivai_record_asaas_subscription_candidate(text,text,text,text,numeric,text)
 to service_role;

-- A safe inbox for subscription events whose external reference is absent.
create or replace function public.kivai_record_asaas_unmatched_subscription(
 p_event_id text,p_subscription_id text
) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if p_event_id is null or length(p_event_id)<5 or length(p_event_id)>160
   or p_subscription_id is null or length(p_subscription_id)<4 or length(p_subscription_id)>120
 then raise exception 'Evento inválido'; end if;
 insert into public.kivai_asaas_lifecycle_events
  (provider_event_id,event_type,provider_resource_id,processing_status)
 values(p_event_id,'SUBSCRIPTION_CREATED',p_subscription_id,'manual_review')
 on conflict(provider_event_id) do nothing;
 return jsonb_build_object('recorded',true,'linked',false);
end;
$$;
revoke all on function public.kivai_record_asaas_unmatched_subscription(text,text)
 from public,anon,authenticated;
grant execute on function public.kivai_record_asaas_unmatched_subscription(text,text)
 to service_role;
