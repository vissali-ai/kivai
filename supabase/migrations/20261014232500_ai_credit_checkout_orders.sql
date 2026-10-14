-- Prepaid AI purchases are distinct from recurring Kivai subscriptions.
-- Checkout amount and credit packs are server validated, with idempotent settlement.
create table if not exists public.ai_credit_orders(
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_code text not null check (pack_code in ('starter','professional','agency')),
  credits integer not null check (credits in (50,150,400)),
  amount_cents integer not null check (amount_cents in (990,1990,3990)),
  checkout_id text not null unique,
  checkout_reference text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint ai_credit_pack_price_consistency check(
    (pack_code='starter' and credits=50 and amount_cents=990) or
    (pack_code='professional' and credits=150 and amount_cents=1990) or
    (pack_code='agency' and credits=400 and amount_cents=3990)
  )
);
create index if not exists ai_credit_orders_user_idx on public.ai_credit_orders(user_id,created_at desc);
alter table public.ai_credit_orders enable row level security;
revoke all on public.ai_credit_orders from public,anon,authenticated;

create or replace function public.grant_ai_credit_order(
  p_user_id uuid, p_order_id uuid, p_checkout_id text,
  p_checkout_reference text, p_amount_cents integer, p_currency text
) returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  o public.ai_credit_orders%rowtype;
  after_balance integer;
begin
  if p_user_id is null or p_order_id is null or p_currency<>'BRL' then
    return jsonb_build_object('granted',false,'reason','invalid');
  end if;
  select * into o from public.ai_credit_orders
    where id=p_order_id and user_id=p_user_id for update;
  if not found then return jsonb_build_object('granted',false,'reason','missing');end if;
  if o.checkout_id<>p_checkout_id or o.checkout_reference<>p_checkout_reference
    or o.amount_cents<>p_amount_cents then
    return jsonb_build_object('granted',false,'reason','mismatch');
  end if;
  if o.status='paid' then return jsonb_build_object('granted',true,'already_paid',true,'credits',o.credits);end if;
  if o.status<>'pending' then return jsonb_build_object('granted',false,'reason','invalid_status');end if;

  insert into public.ai_credit_wallets(user_id) values(p_user_id)
    on conflict(user_id) do nothing;
  update public.ai_credit_wallets
    set purchased_balance=purchased_balance+o.credits,updated_at=now()
    where user_id=p_user_id returning purchased_balance into after_balance;
  update public.ai_credit_orders set status='paid',paid_at=now() where id=p_order_id;
  return jsonb_build_object('granted',true,'already_paid',false,
    'credits',o.credits,'purchased_remaining',after_balance);
end;
$$;
revoke all on function public.grant_ai_credit_order(uuid,uuid,text,text,integer,text)
  from public,anon,authenticated;
grant execute on function public.grant_ai_credit_order(uuid,uuid,text,text,integer,text)
  to service_role;
