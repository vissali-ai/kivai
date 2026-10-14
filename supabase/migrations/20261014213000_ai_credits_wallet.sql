-- Credits for Kivai AI tools. Additive migration; existing reports and payments unaffected.
-- Calls are server-only through the Supabase service role.
create table if not exists public.ai_credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_month date not null default date_trunc('month', timezone('America/Sao_Paulo', now()))::date,
  free_used integer not null default 0 check (free_used >= 0),
  purchased_balance integer not null default 0 check (purchased_balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_credit_operations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cost integer not null check (cost between 1 and 10),
  free_spent integer not null check (free_spent >= 0),
  purchased_spent integer not null check (purchased_spent >= 0),
  operation_kind text not null check (operation_kind in ('insight', 'import')),
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_credit_operation_total_check check (cost = free_spent + purchased_spent)
);
create index if not exists ai_credit_operations_user_idx on public.ai_credit_operations(user_id, created_at desc);

alter table public.ai_credit_wallets enable row level security;
alter table public.ai_credit_operations enable row level security;
revoke all on public.ai_credit_wallets from public, anon, authenticated;
revoke all on public.ai_credit_operations from public, anon, authenticated;

create or replace function public.get_ai_credit_balance(p_user_id uuid)
returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  w public.ai_credit_wallets%rowtype;
  used integer := 0;
  purchased integer := 0;
begin
  if p_user_id is null then raise exception 'INVALID_USER'; end if;
  select * into w from public.ai_credit_wallets where user_id = p_user_id;
  if found then
    if w.free_month = m then used := w.free_used; end if;
    purchased := w.purchased_balance;
  end if;
  return jsonb_build_object(
    'free_limit', 10, 'free_remaining', greatest(0, 10 - used),
    'purchased_remaining', purchased, 'total_remaining', greatest(0, 10 - used) + purchased,
    'renews_on', (m + interval '1 month')::date
  );
end;
$$;

create or replace function public.reserve_ai_credits(
  p_user_id uuid, p_operation_id uuid, p_operation_kind text, p_cost integer
) returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  w public.ai_credit_wallets%rowtype;
  prior public.ai_credit_operations%rowtype;
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  a integer; b integer; available integer;
begin
  if p_user_id is null or p_operation_id is null or p_cost not in (1,2) or
    p_operation_kind not in ('insight', 'import') then
    raise exception 'INVALID_CREDIT_REQUEST';
  end if;
  insert into public.ai_credit_wallets (user_id, free_month)
  values (p_user_id, m) on conflict (user_id) do nothing;
  select * into w from public.ai_credit_wallets where user_id = p_user_id for update;
  if w.free_month <> m then
    update public.ai_credit_wallets set free_month = m, free_used = 0, updated_at = now()
    where user_id = p_user_id;
    w.free_month := m; w.free_used := 0;
  end if;
  select * into prior from public.ai_credit_operations where id = p_operation_id;
  if found then
    if prior.user_id <> p_user_id or prior.cost <> p_cost or prior.operation_kind <> p_operation_kind then
      raise exception 'CREDIT_OPERATION_CONFLICT';
    end if;
    return jsonb_build_object('allowed', prior.status in ('reserved','completed'), 'status', prior.status);
  end if;
  available := 10 - w.free_used + w.purchased_balance;
  if available < p_cost then
    return jsonb_build_object('allowed', false, 'reason', 'insufficient_credits',
      'free_remaining', greatest(0,10 - w.free_used), 'purchased_remaining', w.purchased_balance);
  end if;
  a := least(p_cost, 10 - w.free_used);
  b := p_cost - a;
  update public.ai_credit_wallets set free_used = free_used + a,
    purchased_balance = purchased_balance - b, updated_at = now() where user_id = p_user_id;
  insert into public.ai_credit_operations(id,user_id,cost,free_spent,purchased_spent,operation_kind)
    values(p_operation_id,p_user_id,p_cost,a,b,p_operation_kind);
  return jsonb_build_object('allowed',true,'status','reserved');
end;
$$;

create or replace function public.finalize_ai_credits(
  p_user_id uuid, p_operation_id uuid, p_success boolean
) returns boolean language plpgsql security definer
set search_path = public
as $$
declare
  op public.ai_credit_operations%rowtype;
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
begin
  if p_user_id is null or p_operation_id is null or p_success is null then return false; end if;
  select * into op from public.ai_credit_operations
    where id = p_operation_id and user_id = p_user_id for update;
  if not found then return false; end if;
  if op.status <> 'reserved' then return op.status = case when p_success then 'completed' else 'refunded' end; end if;
  if not p_success then
    -- The free allocation has a calendar-month boundary; never refund into a new month.
    update public.ai_credit_wallets set
      free_used = case when free_month = date_trunc('month', timezone('America/Sao_Paulo',op.created_at))::date
        then greatest(0, free_used - op.free_spent) else free_used end,
      purchased_balance = purchased_balance + op.purchased_spent,
      updated_at = now()
    where user_id = p_user_id;
  end if;
  update public.ai_credit_operations
    set status = case when p_success then 'completed' else 'refunded' end, updated_at = now()
    where id = p_operation_id;
  return true;
end;
$$;

revoke all on function public.get_ai_credit_balance(uuid) from public, anon, authenticated;
revoke all on function public.reserve_ai_credits(uuid,uuid,text,integer) from public, anon, authenticated;
revoke all on function public.finalize_ai_credits(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.get_ai_credit_balance(uuid) to service_role;
grant execute on function public.reserve_ai_credits(uuid,uuid,text,integer) to service_role;
grant execute on function public.finalize_ai_credits(uuid,uuid,boolean) to service_role;
