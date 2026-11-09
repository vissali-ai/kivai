-- Base isolada para sincronização de cobranças do Asaas.
-- NÃO migra clientes InfinitePay. Sem configuração do Asaas, nada muda no checkout.
create table if not exists public.kivai_recurring_provider_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_subscription_id text not null unique,
  provider_customer_id text,
  plan_code public.kivai_plan_code not null check (plan_code in ('pro','agency')),
  billing_cycle text not null check (billing_cycle in ('monthly','annual')),
  expected_amount_brl numeric(10,2) not null check (expected_amount_brl > 0),
  state text not null default 'active' check (state in ('active','suspended','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists kivai_recurring_single_active_per_user
  on public.kivai_recurring_provider_links(user_id) where state='active';
create index if not exists kivai_recurring_provider_links_user
  on public.kivai_recurring_provider_links(user_id, created_at desc);

create table if not exists public.kivai_recurring_paid_charges (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'asaas' check (provider = 'asaas'),
  provider_payment_id text not null unique,
  provider_subscription_id text not null references public.kivai_recurring_provider_links(provider_subscription_id),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  amount_brl numeric(10,2) not null check(amount_brl > 0),
  period_end timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists kivai_recurring_paid_charges_owner
  on public.kivai_recurring_paid_charges(user_id, created_at desc);

create table if not exists public.kivai_recurring_webhook_inbox (
  provider_event_id text primary key,
  event_type text not null,
  provider_payment_id text,
  provider_subscription_id text,
  processing_status text not null default 'pending'
    check (processing_status in ('pending','applied','duplicate','manual_review','ignored')),
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists kivai_recurring_webhook_pending_idx
  on public.kivai_recurring_webhook_inbox(created_at) where processing_status in ('pending','manual_review');

alter table public.kivai_recurring_provider_links enable row level security;
alter table public.kivai_recurring_paid_charges enable row level security;
alter table public.kivai_recurring_webhook_inbox enable row level security;
revoke all on public.kivai_recurring_provider_links from public, anon, authenticated;
revoke all on public.kivai_recurring_paid_charges from public, anon, authenticated;
revoke all on public.kivai_recurring_webhook_inbox from public, anon, authenticated;
grant select, insert, update, delete on public.kivai_recurring_provider_links to service_role;
grant select, insert, update, delete on public.kivai_recurring_paid_charges to service_role;
grant select, insert, update, delete on public.kivai_recurring_webhook_inbox to service_role;

-- Chamado APENAS após consultar o pagamento autenticado na API oficial do provedor.
-- A restrição UNIQUE de provider_payment_id impede estender dois períodos por um mesmo pagamento.
create or replace function public.kivai_apply_asaas_paid_charge(
  p_payment_id text,
  p_subscription_id text,
  p_amount_brl numeric,
  p_event_id text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_link public.kivai_recurring_provider_links;
  v_existing public.user_subscriptions;
  v_charge_id uuid;
  v_start timestamptz;
  v_end timestamptz;
begin
  if length(coalesce(p_payment_id,'')) < 4 or length(coalesce(p_subscription_id,'')) < 4 or length(coalesce(p_event_id,'')) < 4 then
    raise exception 'Identificadores inválidos';
  end if;
  select * into v_link
  from public.kivai_recurring_provider_links
  where provider_subscription_id=p_subscription_id and provider='asaas' and state='active';
  if v_link.id is null then raise exception 'Assinatura Asaas não vinculada'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_link.user_id::text, 0));
  select * into v_link from public.kivai_recurring_provider_links
    where id=v_link.id and state='active' for update;
  if v_link.id is null then raise exception 'Vínculo de assinatura inativo'; end if;
  if p_amount_brl is distinct from v_link.expected_amount_brl then
    raise exception 'Valor divergente';
  end if;

  -- Antes de gravar a cobrança, confira TODAS as assinaturas vigentes do usuário.
  -- Uma assinatura antiga ativa pode coexistir com uma linha inativa mais recente.
  if exists (
    select 1
    from public.user_subscriptions active_sub
    where active_sub.user_id = v_link.user_id
      and active_sub.status = 'active'
      and active_sub.current_period_end > now()
      and (
        coalesce(active_sub.provider, '') <> 'asaas'
        or active_sub.provider_subscription_id is distinct from p_subscription_id
      )
  ) then
    raise exception 'Há um plano ativo de outra origem; conciliação manual necessária';
  end if;

  insert into public.kivai_recurring_paid_charges(
    provider_payment_id,provider_subscription_id,user_id,event_id,amount_brl
  ) values(p_payment_id,p_subscription_id,v_link.user_id,p_event_id,p_amount_brl)
  on conflict(provider_payment_id) do nothing returning id into v_charge_id;
  if v_charge_id is null then
    return jsonb_build_object('applied',false,'reason','already_processed');
  end if;

  select * into v_existing from public.user_subscriptions
   where user_id=v_link.user_id order by updated_at desc,created_at desc,id desc limit 1 for update;
  -- Evita revogar ou sobrescrever um contrato atual ainda ativo em outro provedor.
  if v_existing.id is not null and v_existing.status='active'
    and v_existing.current_period_end > now() and
    (coalesce(v_existing.provider,'') <> 'asaas'
      or v_existing.provider_subscription_id is distinct from p_subscription_id) then
    raise exception 'Há um plano ativo de outra origem; conciliação manual necessária';
  end if;

  if v_existing.id is not null and v_existing.provider='asaas'
     and v_existing.provider_subscription_id=p_subscription_id and v_existing.status='active'
     and v_existing.current_period_end > now() then
    v_start := v_existing.current_period_end;
  else
    v_start := now();
  end if;
  v_end := v_start + case when v_link.billing_cycle='annual' then interval '1 year' else interval '1 month' end;

  if v_existing.id is null then
    insert into public.user_subscriptions(
      user_id,plan_code,status,provider,provider_customer_id,provider_subscription_id,
      billing_cycle,current_period_start,current_period_end,test_access
    ) values(
      v_link.user_id,v_link.plan_code,'active','asaas',v_link.provider_customer_id,p_subscription_id,
      v_link.billing_cycle,now(),v_end,false
    );
  else
    update public.user_subscriptions set
      plan_code=v_link.plan_code,status='active',provider='asaas',
      provider_customer_id=v_link.provider_customer_id,
      provider_subscription_id=p_subscription_id,billing_cycle=v_link.billing_cycle,
      current_period_start=now(),current_period_end=v_end,
      cancel_at_period_end=false,grace_until=null,test_access=false,updated_at=now()
    where id=v_existing.id;
  end if;

  update public.kivai_recurring_paid_charges set period_end=v_end where id=v_charge_id;
  update public.user_profiles set plan_code=v_link.plan_code,lifecycle_stage='active',updated_at=now()
   where user_id=v_link.user_id;
  if not found then raise exception 'Perfil não encontrado'; end if;
  insert into public.customer_marketing_events(user_id,event_type,description,metadata)
    values(v_link.user_id,'subscription_renewed','Pagamento recorrente confirmado por API Asaas.',
    jsonb_build_object('provider','asaas','payment_id',p_payment_id,'subscription_id',p_subscription_id,'period_end',v_end));
  return jsonb_build_object('applied',true,'period_end',v_end,'user_id',v_link.user_id);
end;
$$;
revoke all on function public.kivai_apply_asaas_paid_charge(text,text,numeric,text) from public,anon,authenticated;
grant execute on function public.kivai_apply_asaas_paid_charge(text,text,numeric,text) to service_role;
