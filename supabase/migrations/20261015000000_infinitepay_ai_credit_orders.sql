-- Security metadata for InfinitePay credit purchases. Does not touch existing SumUp subscriptions.
alter table public.ai_credit_orders
  add column if not exists transaction_nsu text,
  add column if not exists invoice_slug text,
  add column if not exists checkout_url text;
create unique index if not exists ai_credit_orders_paid_transaction_uq
  on public.ai_credit_orders(transaction_nsu)
  where transaction_nsu is not null;

create or replace function public.grant_ai_credit_order(
  p_user_id uuid, p_order_id uuid, p_checkout_id text,
  p_checkout_reference text, p_amount_cents integer, p_currency text,
  p_transaction_nsu text, p_invoice_slug text
) returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  o public.ai_credit_orders%rowtype;
  after_balance integer;
begin
  if p_user_id is null or p_order_id is null or p_currency <> 'BRL'
    or length(trim(coalesce(p_transaction_nsu,''))) < 8
    or length(trim(coalesce(p_invoice_slug,''))) < 2 then
    return jsonb_build_object('granted',false,'reason','invalid');
  end if;
  select * into o from public.ai_credit_orders
    where id = p_order_id and user_id = p_user_id for update;
  if not found then return jsonb_build_object('granted',false,'reason','missing'); end if;
  if o.checkout_id <> p_checkout_id or o.checkout_reference <> p_checkout_reference
    or o.amount_cents <> p_amount_cents then
    return jsonb_build_object('granted',false,'reason','mismatch');
  end if;
  if o.status = 'paid' then
    return jsonb_build_object('granted',o.transaction_nsu=p_transaction_nsu,
      'already_paid',true,'credits',o.credits);
  end if;
  if o.status <> 'pending' then return jsonb_build_object('granted',false,'reason','invalid_status'); end if;

  insert into public.ai_credit_wallets(user_id) values(p_user_id)
    on conflict(user_id) do nothing;
  update public.ai_credit_wallets
    set purchased_balance = purchased_balance + o.credits, updated_at = now()
    where user_id = p_user_id returning purchased_balance into after_balance;
  update public.ai_credit_orders
    set status='paid',paid_at=now(),transaction_nsu=p_transaction_nsu,invoice_slug=p_invoice_slug
    where id = p_order_id;
  return jsonb_build_object('granted',true,'already_paid',false,
    'credits',o.credits,'purchased_remaining',after_balance);
end;
$$;

revoke all on function public.grant_ai_credit_order(uuid,uuid,text,text,integer,text,text,text)
  from public,anon,authenticated;
grant execute on function public.grant_ai_credit_order(uuid,uuid,text,text,integer,text,text,text)
  to service_role;

-- Supersede the 6-argument grant function to prevent bypassing transaction verification.
drop function if exists public.grant_ai_credit_order(uuid,uuid,text,text,integer,text);
