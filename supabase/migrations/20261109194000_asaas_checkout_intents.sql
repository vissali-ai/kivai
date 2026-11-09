-- Checkout Asaas: reservas transacionais e isoladas. Sem cobranças ou migração de clientes.
-- Não habilita webhooks e não modifica assinaturas já existentes.
create table if not exists public.kivai_asaas_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_reference text not null unique
    check (external_reference ~ '^kivai_asaas_[0-9a-f-]{36}$'),
  provider_checkout_id text unique,
  provider_subscription_id text unique,
  plan_code public.kivai_plan_code not null check (plan_code in ('pro','agency')),
  billing_cycle text not null check (billing_cycle in ('monthly','annual')),
  expected_amount_brl numeric(10,2) not null check (expected_amount_brl > 0),
  state text not null default 'reserved'
    check (state in ('reserved','creating','created','paid','expired','canceled','manual_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  last_error text,
  constraint provider_id_only_after_create check (
    provider_checkout_id is null or state in ('created','paid','expired','canceled','manual_review')
  )
);
create unique index if not exists kivai_asaas_checkout_one_open_per_user
  on public.kivai_asaas_checkout_intents(user_id)
  where state in ('reserved','creating','created','manual_review');
create index if not exists kivai_asaas_checkout_owner_created
  on public.kivai_asaas_checkout_intents(user_id, created_at desc);

alter table public.kivai_asaas_checkout_intents enable row level security;
revoke all on public.kivai_asaas_checkout_intents from public,anon,authenticated;
grant select,insert,update on public.kivai_asaas_checkout_intents to service_role;

-- Reserva atômica antes de qualquer POST ao Asaas.
-- Chamador service_role; a identidade vem de token verificado, nunca do corpo HTTP.
create or replace function public.kivai_reserve_asaas_checkout(
 p_user_id uuid, p_plan_code text, p_billing_cycle text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
 v_price numeric(10,2);
 v_existing public.kivai_asaas_checkout_intents;
 v_row public.kivai_asaas_checkout_intents;
begin
 if p_user_id is null or p_plan_code not in ('pro','agency')
    or p_billing_cycle not in ('monthly','annual') then
   raise exception 'Plano, ciclo ou usuário inválido';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 4567));
 select case when p_billing_cycle='annual' then price_annual_brl else price_monthly_brl end
   into v_price from public.subscription_plans
   where code=p_plan_code::public.kivai_plan_code and active=true limit 1;
 if v_price is null or v_price <= 0 then raise exception 'Preço indisponível'; end if;
 if exists (
   select 1 from public.user_subscriptions s
   where s.user_id=p_user_id and s.status='active'
     and (s.current_period_end is null or s.current_period_end>now())
 ) then raise exception 'Assinatura ativa: use gestão de planos'; end if;
 if exists (
   select 1 from public.subscription_requests r
   where r.user_id=p_user_id and r.status in ('awaiting_payment','payment_reported')
 ) then raise exception 'Solicitação de pagamento ainda pendente'; end if;
 select * into v_existing from public.kivai_asaas_checkout_intents
   where user_id=p_user_id and state in ('reserved','creating','created','manual_review')
   order by created_at desc limit 1 for update;
 if found then
   -- Somente uma reserva que nunca chegou ao provedor pode expirar automaticamente.
   if v_existing.state='reserved' and v_existing.expires_at < now() then
     update public.kivai_asaas_checkout_intents set state='expired',updated_at=now()
       where id=v_existing.id;
   else
     return jsonb_build_object('id',v_existing.id,'state',v_existing.state,
       'external_reference',v_existing.external_reference,'existing',true);
   end if;
 end if;
 insert into public.kivai_asaas_checkout_intents
   (user_id,external_reference,plan_code,billing_cycle,expected_amount_brl)
 values
   (p_user_id,'kivai_asaas_' || gen_random_uuid()::text,
    p_plan_code::public.kivai_plan_code,p_billing_cycle,v_price)
 returning * into v_row;
 return jsonb_build_object('id',v_row.id,'state',v_row.state,
   'external_reference',v_row.external_reference,'existing',false);
end;
$$;
revoke all on function public.kivai_reserve_asaas_checkout(uuid,text,text)
  from public,anon,authenticated;
grant execute on function public.kivai_reserve_asaas_checkout(uuid,text,text)
  to service_role;

-- A transição de reserved para creating é um único passo, sem repetição de POST.
create or replace function public.kivai_claim_asaas_checkout(
 p_id uuid, p_user_id uuid
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_row public.kivai_asaas_checkout_intents;
begin
 if p_id is null or p_user_id is null then raise exception 'Reserva inválida'; end if;
 update public.kivai_asaas_checkout_intents
   set state='creating',updated_at=now()
   where id=p_id and user_id=p_user_id and state='reserved' and expires_at>now()
   returning * into v_row;
 if v_row.id is null then raise exception 'Reserva não disponível para criação'; end if;
 return jsonb_build_object('id',v_row.id,'external_reference',v_row.external_reference,
   'plan_code',v_row.plan_code,'billing_cycle',v_row.billing_cycle,
   'expected_amount_brl',v_row.expected_amount_brl);
end;
$$;
revoke all on function public.kivai_claim_asaas_checkout(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.kivai_claim_asaas_checkout(uuid,uuid)
  to service_role;
