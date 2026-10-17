-- Bônus beta exclusivo do Analisador de Tráfego Pago Google Ads.
-- Aditivo: não altera ai_credit_wallets, planos, assinaturas nem compras existentes.
-- Uma única concessão de 10 créditos por auth.users(id) com e-mail confirmado.
-- Uma análise concluída = um crédito, sem renovação mensal.
-- Todas as funções são RPC server-only chamadas com service_role.

create table if not exists public.traffic_beta_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted integer not null default 10 check (granted = 10),
  remaining integer not null default 10 check (remaining between 0 and 10),
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.traffic_beta_operations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cost integer not null default 1 check (cost = 1),
  status text not null default 'reserved' check (status in ('reserved','completed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists traffic_beta_operations_user_idx
  on public.traffic_beta_operations(user_id, created_at desc);

alter table public.traffic_beta_wallets enable row level security;
alter table public.traffic_beta_operations enable row level security;

revoke all on public.traffic_beta_wallets from public, anon, authenticated;
revoke all on public.traffic_beta_operations from public, anon, authenticated;
grant select, insert, update on public.traffic_beta_wallets to service_role;
grant select, insert, update on public.traffic_beta_operations to service_role;

create or replace function public.get_traffic_beta_balance(p_user_id uuid)
returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  w public.traffic_beta_wallets%rowtype;
  eligible boolean;
begin
  if p_user_id is null then return jsonb_build_object('eligible',false,'remaining',0,'initial',10); end if;
  select exists(
    select 1 from auth.users where id = p_user_id and email_confirmed_at is not null
  ) into eligible;
  if not eligible then return jsonb_build_object('eligible',false,'remaining',0,'initial',10); end if;
  select * into w from public.traffic_beta_wallets where user_id=p_user_id;
  return jsonb_build_object(
    'eligible',true, 'initial',10,
    'remaining', case when found then w.remaining else 10 end,
    'activated', found
  );
end;
$$;

create or replace function public.reserve_traffic_beta_credit(
  p_user_id uuid, p_operation_id uuid
) returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  wallet public.traffic_beta_wallets%rowtype;
  prior public.traffic_beta_operations%rowtype;
begin
  if p_user_id is null or p_operation_id is null then
    return jsonb_build_object('allowed',false,'reason','invalid');
  end if;
  if not exists(
    select 1 from auth.users where id=p_user_id and email_confirmed_at is not null
  ) then
    return jsonb_build_object('allowed',false,'reason','email_unverified');
  end if;

  -- Concessão idempotente. Nunca se repete após 10 créditos utilizados.
  insert into public.traffic_beta_wallets(user_id)
  values(p_user_id) on conflict(user_id) do nothing;
  select * into wallet from public.traffic_beta_wallets
    where user_id=p_user_id for update;

  select * into prior from public.traffic_beta_operations where id=p_operation_id;
  if found then
    if prior.user_id <> p_user_id then raise exception 'BETA_OPERATION_CONFLICT'; end if;
    return jsonb_build_object(
      'allowed',prior.status in ('reserved','completed'),
      'status',prior.status,'remaining',wallet.remaining
    );
  end if;

  if wallet.remaining < 1 then
    return jsonb_build_object('allowed',false,'reason','exhausted','remaining',0);
  end if;

  update public.traffic_beta_wallets
    set remaining=remaining-1,updated_at=now()
    where user_id=p_user_id;
  insert into public.traffic_beta_operations(id,user_id,cost,status)
    values(p_operation_id,p_user_id,1,'reserved');
  return jsonb_build_object('allowed',true,'status','reserved','remaining',wallet.remaining-1);
end;
$$;

create or replace function public.finalize_traffic_beta_credit(
  p_user_id uuid, p_operation_id uuid, p_success boolean
) returns boolean language plpgsql security definer
set search_path = public
as $$
declare
  wallet public.traffic_beta_wallets%rowtype;
  op public.traffic_beta_operations%rowtype;
begin
  if p_user_id is null or p_operation_id is null or p_success is null then
    return false;
  end if;
  -- Ordem de bloqueio compatível com a reserva evita deadlocks.
  select * into wallet from public.traffic_beta_wallets where user_id=p_user_id for update;
  if not found then return false; end if;
  select * into op from public.traffic_beta_operations
    where id=p_operation_id and user_id=p_user_id for update;
  if not found then return false; end if;
  if op.status <> 'reserved' then
    return op.status = case when p_success then 'completed' else 'refunded' end;
  end if;

  if not p_success then
    update public.traffic_beta_wallets
      set remaining=remaining+1,updated_at=now()
      where user_id=p_user_id;
  end if;
  update public.traffic_beta_operations
    set status=case when p_success then 'completed' else 'refunded' end,
        updated_at=now()
    where id=p_operation_id;
  return true;
end;
$$;

create or replace function public.recover_stale_traffic_beta_operations(p_user_id uuid)
returns integer language plpgsql security definer
set search_path = public
as $$
declare
  stale record;
  recovered integer := 0;
begin
  if p_user_id is null then return 0; end if;
  for stale in
    select id from public.traffic_beta_operations
    where user_id=p_user_id and status='reserved'
      and created_at < now()-interval '15 minutes'
    order by created_at limit 50
  loop
    if public.finalize_traffic_beta_credit(p_user_id,stale.id,false) then
      recovered := recovered + 1;
    end if;
  end loop;
  return recovered;
end;
$$;

revoke all on function public.get_traffic_beta_balance(uuid) from public,anon,authenticated;
revoke all on function public.reserve_traffic_beta_credit(uuid,uuid) from public,anon,authenticated;
revoke all on function public.finalize_traffic_beta_credit(uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.recover_stale_traffic_beta_operations(uuid) from public,anon,authenticated;
grant execute on function public.get_traffic_beta_balance(uuid) to service_role;
grant execute on function public.reserve_traffic_beta_credit(uuid,uuid) to service_role;
grant execute on function public.finalize_traffic_beta_credit(uuid,uuid,boolean) to service_role;
grant execute on function public.recover_stale_traffic_beta_operations(uuid) to service_role;

comment on table public.traffic_beta_wallets is
  'Bônus beta de 10 análises IA, uma vez por usuário verificado, isolado dos demais planos e créditos';
