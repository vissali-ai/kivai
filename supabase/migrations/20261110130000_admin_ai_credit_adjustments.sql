-- Manual AI credit adjustments, separate from payment fulfillment.
-- A service-role-only function atomically updates balances and writes a durable audit trail.
create table if not exists public.ai_credit_admin_adjustments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0 and delta between -10000 and 10000),
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null check (char_length(trim(reason)) between 10 and 500),
  operator_email text not null check (char_length(trim(operator_email)) between 5 and 254),
  created_at timestamptz not null default now(),
  constraint ai_credit_adjustment_math check (balance_after = balance_before + delta)
);
create index if not exists ai_credit_admin_adjustments_user_created
  on public.ai_credit_admin_adjustments (user_id, created_at desc);
alter table public.ai_credit_admin_adjustments enable row level security;
revoke all on public.ai_credit_admin_adjustments from public, anon, authenticated;
grant select on public.ai_credit_admin_adjustments to service_role;

create or replace function public.kivai_admin_adjust_ai_credits(
  p_operation_id uuid,
  p_user_id uuid,
  p_delta integer,
  p_reason text,
  p_operator_email text
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  w public.ai_credit_wallets%rowtype;
  prior public.ai_credit_admin_adjustments%rowtype;
  before_balance integer;
  after_balance integer;
  clean_reason text := trim(coalesce(p_reason, ''));
  clean_operator text := lower(trim(coalesce(p_operator_email, '')));
begin
  if p_operation_id is null or p_user_id is null or p_delta is null or
     p_delta = 0 or p_delta < -10000 or p_delta > 10000 or
     char_length(clean_reason) < 10 or char_length(clean_reason) > 500 or
     clean_operator !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or
     char_length(clean_operator) > 254 then
    raise exception 'INVALID_ADMIN_CREDIT_ADJUSTMENT';
  end if;
  -- The service role is the only executor. No grant to anon/authenticated.
  -- The admin session is verified server-side before sending the request.
  perform 1 from auth.users where id = p_user_id;
  if not found then raise exception 'CUSTOMER_NOT_FOUND'; end if;

  -- Serialize first-time wallet inserts by user, then lock the wallet row.
  insert into public.ai_credit_wallets(user_id)
    values (p_user_id) on conflict (user_id) do nothing;
  select * into w from public.ai_credit_wallets
    where user_id = p_user_id for update;
  before_balance := w.purchased_balance;

  -- Retried requests must not grant twice.
  select * into prior from public.ai_credit_admin_adjustments
    where id = p_operation_id;
  if found then
    if prior.user_id <> p_user_id or prior.delta <> p_delta or
       prior.reason <> clean_reason or prior.operator_email <> clean_operator then
      raise exception 'ADMIN_CREDIT_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('applied', false, 'already_applied', true,
      'balance_after', prior.balance_after);
  end if;
  if before_balance + p_delta < 0 then
    raise exception 'INSUFFICIENT_PURCHASED_CREDIT_BALANCE';
  end if;
  if before_balance + p_delta > 2147483647 then
    raise exception 'CREDIT_BALANCE_OVERFLOW';
  end if;
  after_balance := before_balance + p_delta;
  update public.ai_credit_wallets
    set purchased_balance = after_balance, updated_at = now()
    where user_id = p_user_id;
  insert into public.ai_credit_admin_adjustments
    (id, user_id, delta, balance_before, balance_after, reason, operator_email)
    values (p_operation_id, p_user_id, p_delta, before_balance,
      after_balance, clean_reason, clean_operator);
  return jsonb_build_object('applied', true, 'already_applied', false,
    'balance_after', after_balance);
end;
$$;
revoke all on function public.kivai_admin_adjust_ai_credits(uuid,uuid,integer,text,text)
  from public, anon, authenticated;
grant execute on function public.kivai_admin_adjust_ai_credits(uuid,uuid,integer,text,text)
  to service_role;
