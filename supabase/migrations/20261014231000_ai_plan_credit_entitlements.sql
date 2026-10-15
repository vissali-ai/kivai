-- Monthly AI allowance follows the authenticated subscription, without changing plan entitlements.
-- Free:10, Pro:100, Agency:300 per Sao Paulo calendar month.
create or replace function public.ai_credit_active_plan(p_user_id uuid)
returns text language sql stable security definer
set search_path=public
as $$
  select coalesce((
    select s.plan_code::text from public.user_subscriptions s
    where s.user_id = p_user_id
      and s.status::text = 'active'
      and (s.current_period_end > now() or s.grace_until > now())
      and s.plan_code::text in ('pro','agency')
    order by case s.plan_code::text when 'agency' then 2 else 1 end desc
    limit 1
  ), 'free');
$$;
revoke all on function public.ai_credit_active_plan(uuid) from public, anon, authenticated;
grant execute on function public.ai_credit_active_plan(uuid) to service_role;

create or replace function public.get_ai_credit_balance(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  w public.ai_credit_wallets%rowtype;
  plan text := public.ai_credit_active_plan(p_user_id);
  quota integer := case plan when 'agency' then 300 when 'pro' then 100 else 10 end;
  used integer := 0;
  purchased integer := 0;
begin
  if p_user_id is null then raise exception 'INVALID_USER'; end if;
  select * into w from public.ai_credit_wallets where user_id=p_user_id;
  if found then
    if w.free_month=m then used:=w.free_used; end if;
    purchased:=w.purchased_balance;
  end if;
  return jsonb_build_object('plan_code',plan,'free_limit',quota,
    'free_remaining',greatest(0,quota-used), 'purchased_remaining',purchased,
    'total_remaining',greatest(0,quota-used)+purchased,
    'renews_on',(m+interval '1 month')::date);
end;
$$;

create or replace function public.reserve_ai_credits(
  p_user_id uuid, p_operation_id uuid, p_operation_kind text, p_cost integer
) returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  w public.ai_credit_wallets%rowtype;
  prior public.ai_credit_operations%rowtype;
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  plan text := public.ai_credit_active_plan(p_user_id);
  quota integer := case plan when 'agency' then 300 when 'pro' then 100 else 10 end;
  a integer; b integer; available integer;
begin
  if p_user_id is null or p_operation_id is null or p_cost not in (1,2)
    or p_operation_kind not in ('insight','import') then
    raise exception 'INVALID_CREDIT_REQUEST';
  end if;
  insert into public.ai_credit_wallets(user_id,free_month)
    values (p_user_id,m) on conflict(user_id) do nothing;
  select * into w from public.ai_credit_wallets where user_id=p_user_id for update;
  if w.free_month <> m then
    update public.ai_credit_wallets set free_month=m,free_used=0,updated_at=now()
      where user_id=p_user_id;
    w.free_month:=m;w.free_used:=0;
  end if;
  select * into prior from public.ai_credit_operations where id=p_operation_id;
  if found then
    if prior.user_id<>p_user_id or prior.cost<>p_cost
      or prior.operation_kind<>p_operation_kind then raise exception 'CREDIT_OPERATION_CONFLICT';end if;
    return jsonb_build_object('allowed',prior.status in ('reserved','completed'),'status',prior.status);
  end if;
  available:=greatest(0,quota-w.free_used)+w.purchased_balance;
  if available<p_cost then
    return jsonb_build_object('allowed',false,'reason','insufficient_credits',
      'free_remaining',greatest(0,quota-w.free_used),'purchased_remaining',w.purchased_balance);
  end if;
  a:=least(p_cost,greatest(0,quota-w.free_used));
  b:=p_cost-a;
  update public.ai_credit_wallets
    set free_used=free_used+a,purchased_balance=purchased_balance-b,updated_at=now()
    where user_id=p_user_id;
  insert into public.ai_credit_operations(id,user_id,cost,free_spent,purchased_spent,operation_kind)
    values(p_operation_id,p_user_id,p_cost,a,b,p_operation_kind);
  return jsonb_build_object('allowed',true,'status','reserved');
end;
$$;

revoke all on function public.get_ai_credit_balance(uuid) from public, anon, authenticated;
revoke all on function public.reserve_ai_credits(uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.get_ai_credit_balance(uuid) to service_role;
grant execute on function public.reserve_ai_credits(uuid,uuid,text,integer) to service_role;
