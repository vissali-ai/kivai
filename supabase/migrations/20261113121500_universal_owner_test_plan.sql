-- Universal plan simulation for one existing, verified Kivai owner account.
-- Entitlements are simulated; no subscriptions, invoices or billing records are changed.
create table if not exists public.kivai_test_plan_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan_code public.kivai_plan_code not null default 'free',
 updated_at timestamptz not null default now(),
 constraint kivai_test_plan_owner_only check (user_id='c07f6709-a9a3-45c0-9a89-22076649fd37'::uuid)
);
alter table public.kivai_test_plan_settings enable row level security;
revoke all on public.kivai_test_plan_settings from public,anon,authenticated;
grant select on public.kivai_test_plan_settings to authenticated;
grant select,insert,update,delete on public.kivai_test_plan_settings to service_role;
drop policy if exists "Owner reads own simulated plan" on public.kivai_test_plan_settings;
create policy "Owner reads own simulated plan" on public.kivai_test_plan_settings
 for select to authenticated using (auth.uid()=user_id);
-- Only service-role API routes may change the simulated plan.
insert into public.kivai_test_plan_settings(user_id,plan_code)
values('c07f6709-a9a3-45c0-9a89-22076649fd37','free')
on conflict(user_id) do nothing;

-- Primary entitlement checked by video, project limits, social features and plans.
create or replace function public.kivai_effective_plan(p_user_id uuid)
returns public.kivai_plan_code language sql stable set search_path='' as $$
 select coalesce(
  (select t.plan_code from public.kivai_test_plan_settings t where t.user_id=p_user_id),
  (select s.plan_code from public.user_subscriptions s
    where s.user_id=p_user_id and s.status='active'
      and s.current_period_end > now() and s.current_period_start <= now()
    order by s.updated_at desc,s.created_at desc,s.id desc limit 1),
  'free'::public.kivai_plan_code
 );
$$;
revoke all on function public.kivai_effective_plan(uuid) from public,anon;
grant execute on function public.kivai_effective_plan(uuid) to authenticated,service_role;

-- IA credit quotas previously used a separate plan lookup; unify this with
-- the same simulated entitlement. Keep the existing subscription grace behavior.
create or replace function public.ai_credit_active_plan(p_user_id uuid)
returns text language sql stable security definer set search_path='public' as $$
 select coalesce(
  (select t.plan_code::text from public.kivai_test_plan_settings t where t.user_id=p_user_id),
  (select s.plan_code::text from public.user_subscriptions s
   where s.user_id=p_user_id
    and s.status::text='active'
    and (s.current_period_end>now() or s.grace_until>now())
    and s.plan_code::text in ('pro','agency')
   order by case s.plan_code::text when 'agency' then 2 else 1 end desc limit 1),
  'free'
 );
$$;
revoke all on function public.ai_credit_active_plan(uuid) from public,anon,authenticated;
grant execute on function public.ai_credit_active_plan(uuid) to service_role;
