-- Public free mode: preserve active paid subscriptions and billing records, while
-- applying internal account storage limits and one-time starter AI credits.

-- Existing plan subscriptions stay effective for users who already pay. New
-- subscription sales are disabled in the application layer.

-- Keep social account/history features available to logged-in users without
-- their former Pro/Agency quotas. All data remains private under existing RLS.
create or replace function public.kivai_check_social_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  if tg_table_name='social_accounts' and new.follower_count>500000 and public.kivai_effective_plan(new.user_id)='pro' then
    raise exception 'Limite técnico excedido';
  end if;
  if tg_table_name='social_snapshots' and not exists(
    select 1 from public.social_accounts where id=new.social_account_id and user_id=new.user_id
  ) then raise exception 'Perfil inválido'; end if;
  return new;
end;
$$;

-- Up to five saved projects total and 100 MiB of combined payload/file storage per user.
-- Updates to existing projects remain possible; all other identity, revision,
-- kind, title, and payload validations are preserved.
create or replace function public.kivai_save_project(
  p_user_id uuid,p_id uuid,p_kind text,p_title text,p_client text,p_payload jsonb,p_revision integer
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row public.saved_tool_projects; v_client text:=trim(coalesce(p_client,'')); v_storage bigint:=0; v_limit bigint:=104857600; v_projects integer:=5;
begin
  if p_user_id is null then raise exception 'Usuário inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select (value#>>'{}')::integer into v_projects from public.kivai_public_mode_settings where key='project_limit';
  select (value#>>'{}')::bigint into v_limit from public.kivai_public_mode_settings where key='user_storage_bytes';
  if p_kind='video_summary' then raise exception 'Use o salvamento de vídeos'; end if;
  if char_length(btrim(p_title)) not between 1 and 120 or octet_length(p_payload::text)>524288 then raise exception 'Dados inválidos'; end if;
  if p_client<>'' then raise exception 'Dados inválidos'; end if;
  if p_id is null then
    if (select count(*) from public.saved_tool_projects where user_id=p_user_id)>=v_projects then raise exception 'Capacidade de projetos atingida'; end if;
    select coalesce(sum(case when coalesce(o.metadata->>'size','') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) into v_storage
      from storage.objects o where split_part(o.name,'/',1)=p_user_id::text and o.bucket_id not in ('hosted-favicons','hosted-placeholders');
    select v_storage+coalesce(sum(f.byte_size),0) into v_storage from public.hosted_favicons f where f.user_id=p_user_id;
    select v_storage+coalesce(sum(h.byte_size),0) into v_storage from public.hosted_placeholders h where h.user_id=p_user_id;
    if coalesce((select sum(pg_column_size(payload)) from public.saved_tool_projects where user_id=p_user_id),0)+v_storage+pg_column_size(p_payload)>v_limit then raise exception 'Capacidade de projetos atingida'; end if;
    insert into public.saved_tool_projects(user_id,kind,title,client_name,payload) values(p_user_id,p_kind,btrim(p_title),'',p_payload) returning * into v_row;
  else
    select * into v_row from public.saved_tool_projects where id=p_id and user_id=p_user_id for update;
    if v_row.id is null then raise exception 'Projeto não encontrado'; end if;
    if v_row.revision<>p_revision then raise exception 'Projeto alterado em outra aba. Abra novamente antes de salvar'; end if;
    if v_row.kind<>p_kind then raise exception 'Tipo de projeto inválido'; end if;
    select coalesce(sum(case when coalesce(o.metadata->>'size','') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) into v_storage
      from storage.objects o where split_part(o.name,'/',1)=p_user_id::text and o.bucket_id not in ('hosted-favicons','hosted-placeholders');
    select v_storage+coalesce(sum(f.byte_size),0) into v_storage from public.hosted_favicons f where f.user_id=p_user_id;
    select v_storage+coalesce(sum(h.byte_size),0) into v_storage from public.hosted_placeholders h where h.user_id=p_user_id;
    if coalesce((select sum(pg_column_size(payload)) from public.saved_tool_projects where user_id=p_user_id and id<>p_id),0)+v_storage+pg_column_size(p_payload)>v_limit then raise exception 'Capacidade de projetos atingida'; end if;
    update public.saved_tool_projects set title=btrim(p_title),client_name='',payload=p_payload,revision=revision+1,updated_at=now() where id=p_id returning * into v_row;
  end if;
  return to_jsonb(v_row);
end;
$$;
revoke all on function public.kivai_save_project(uuid,uuid,text,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.kivai_save_project(uuid,uuid,text,text,text,jsonb,integer) to service_role;

-- The dedicated video-library RPC has the same shared per-user project and
-- payload limits. Legacy rows above the limit remain readable and deletable.
create or replace function public.kivai_save_video_project(p_user_id uuid,p_id uuid,p_title text,p_payload jsonb,p_revision integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row public.saved_tool_projects; v_storage bigint:=0; v_limit bigint:=104857600; v_projects integer:=5;
begin
  if p_user_id is null then raise exception 'Usuário inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select (value#>>'{}')::integer into v_projects from public.kivai_public_mode_settings where key='project_limit';
  select (value#>>'{}')::bigint into v_limit from public.kivai_public_mode_settings where key='user_storage_bytes';
  if char_length(btrim(p_title)) not between 1 and 120 or octet_length(p_payload::text)>524288 then raise exception 'Dados inválidos'; end if;
  if p_id is not null then
    select * into v_row from public.saved_tool_projects where id=p_id and user_id=p_user_id and kind='video_summary' for update;
    if v_row.id is null then raise exception 'Resumo não encontrado'; end if;
    if v_row.revision<>p_revision then raise exception 'Resumo alterado em outra aba'; end if;
    select coalesce(sum(case when coalesce(o.metadata->>'size','') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) into v_storage
      from storage.objects o where split_part(o.name,'/',1)=p_user_id::text and o.bucket_id not in ('hosted-favicons','hosted-placeholders');
    select v_storage+coalesce(sum(f.byte_size),0) into v_storage from public.hosted_favicons f where f.user_id=p_user_id;
    select v_storage+coalesce(sum(h.byte_size),0) into v_storage from public.hosted_placeholders h where h.user_id=p_user_id;
    if coalesce((select sum(pg_column_size(payload)) from public.saved_tool_projects where user_id=p_user_id and id<>p_id),0)+v_storage+pg_column_size(p_payload)>v_limit then raise exception 'Capacidade de projetos atingida'; end if;
    update public.saved_tool_projects set title=btrim(p_title),payload=p_payload,revision=revision+1,updated_at=now() where id=p_id returning * into v_row;
  else
    if (select count(*) from public.saved_tool_projects where user_id=p_user_id)>=v_projects then raise exception 'Capacidade de projetos atingida'; end if;
    select coalesce(sum(case when coalesce(o.metadata->>'size','') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) into v_storage
      from storage.objects o where split_part(o.name,'/',1)=p_user_id::text and o.bucket_id not in ('hosted-favicons','hosted-placeholders');
    select v_storage+coalesce(sum(f.byte_size),0) into v_storage from public.hosted_favicons f where f.user_id=p_user_id;
    select v_storage+coalesce(sum(h.byte_size),0) into v_storage from public.hosted_placeholders h where h.user_id=p_user_id;
    if coalesce((select sum(pg_column_size(payload)) from public.saved_tool_projects where user_id=p_user_id),0)+v_storage+pg_column_size(p_payload)>v_limit then raise exception 'Capacidade de projetos atingida'; end if;
    insert into public.saved_tool_projects(user_id,kind,title,client_name,payload) values(p_user_id,'video_summary',btrim(p_title),'',p_payload) returning * into v_row;
  end if;
  return to_jsonb(v_row);
end;
$$;
revoke all on function public.kivai_save_video_project(uuid,uuid,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.kivai_save_video_project(uuid,uuid,text,jsonb,integer) to service_role;

-- Video study compute usage is no longer gated by subscription plan. Existing
-- operational abuse controls (IP/fingerprint/day) are retained elsewhere.
create or replace function public.kivai_reserve_video_study_usage(p_user_id uuid,p_kind text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_month date:=date_trunc('month',now() at time zone 'utc')::date;
begin
  if p_user_id is null or p_kind not in ('summary','audio') then raise exception 'Tipo inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  insert into public.video_study_usage(user_id,month_start) values(p_user_id,v_month) on conflict do nothing;
  if p_kind='summary' then update public.video_study_usage set summaries=summaries+1 where user_id=p_user_id and month_start=v_month;
  else update public.video_study_usage set audio=audio+1 where user_id=p_user_id and month_start=v_month; end if;
  return true;
end $$;
revoke all on function public.kivai_reserve_video_study_usage(uuid,text) from public,anon,authenticated;
grant execute on function public.kivai_reserve_video_study_usage(uuid,text) to service_role;

-- Configure all current and future users with a one-time 5-credit starter
-- balance. Purchased credits remain untouched; existing subscribers retain
-- their paid-plan AI entitlements until their subscriptions end.
create table if not exists public.kivai_public_mode_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.kivai_public_mode_settings enable row level security;
revoke all on public.kivai_public_mode_settings from public,anon,authenticated;
grant select,insert,update,delete on public.kivai_public_mode_settings to service_role;
insert into public.kivai_public_mode_settings(key,value) values
  ('project_limit', '5'::jsonb),
  ('user_storage_bytes', '104857600'::jsonb),
  ('initial_ai_credits', '5'::jsonb)
on conflict(key) do nothing;

-- Free accounts may host favicons too; keep only a technical per-file cap.
create or replace function public.kivai_reserve_favicon(p_user_id uuid, p_path text, p_url text, p_bytes integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  if not exists(select 1 from auth.users where id=p_user_id) then raise exception 'INVALID_USER'; end if;
  if p_bytes<1 or p_bytes>512000 then raise exception 'FAVICON_TOO_LARGE'; end if;
  if p_path not like p_user_id::text||'/%' then raise exception 'INVALID_PATH'; end if;
  if coalesce((select sum(pg_column_size(payload)) from public.saved_tool_projects where user_id=p_user_id),0)
    +coalesce((select sum(case when coalesce(metadata->>'size','') ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end) from storage.objects where split_part(name,'/',1)=p_user_id::text and bucket_id not in ('hosted-favicons','hosted-placeholders')),0)
    +coalesce((select sum(byte_size) from public.hosted_favicons where user_id=p_user_id),0)
    +coalesce((select sum(byte_size) from public.hosted_placeholders where user_id=p_user_id),0)+p_bytes
    >(select (value#>>'{}')::bigint from public.kivai_public_mode_settings where key='user_storage_bytes') then
    raise exception 'USER_STORAGE_LIMIT';
  end if;
  insert into public.hosted_favicons(user_id,storage_path,public_url,byte_size)
    values(p_user_id,p_path,p_url,p_bytes) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.kivai_reserve_favicon(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.kivai_reserve_favicon(uuid,text,text,integer) to service_role;

-- Enforce the hidden per-user storage budget for direct authenticated uploads
-- whose first object-path segment is the owning auth user ID. Service-side
-- admin/system uploads keep their existing policies.
create or replace function public.kivai_enforce_user_storage_budget()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_owner uuid; v_used bigint; v_limit bigint:=104857600; v_new bigint;
begin
  select (value#>>'{}')::bigint into v_limit from public.kivai_public_mode_settings where key='user_storage_bytes';
  begin v_owner:=split_part(new.name,'/',1)::uuid; exception when others then return new; end;
  if not exists(select 1 from auth.users where id=v_owner) then return new; end if;
  if auth.uid() is not null and v_owner is distinct from auth.uid() then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text,0));
  v_new:=case when coalesce(new.metadata->>'size','') ~ '^[0-9]+$' then (new.metadata->>'size')::bigint else 0 end;
  select coalesce(sum(case when coalesce(o.metadata->>'size','') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) into v_used
    from storage.objects o where split_part(o.name,'/',1)=v_owner::text and o.bucket_id not in ('hosted-favicons','hosted-placeholders')
      and (tg_op='INSERT' or o.id<>new.id);
  select v_used+coalesce(sum(f.byte_size),0) into v_used from public.hosted_favicons f where f.user_id=v_owner;
  select v_used+coalesce(sum(p.byte_size),0) into v_used from public.hosted_placeholders p where p.user_id=v_owner;
  select coalesce(sum(pg_column_size(p.payload)),0)+v_used into v_used
    from public.saved_tool_projects p where p.user_id=v_owner;
  if v_used+v_new>v_limit then raise exception 'USER_STORAGE_LIMIT'; end if;
  return new;
end;
$$;
drop trigger if exists kivai_user_storage_budget_guard on storage.objects;
create trigger kivai_user_storage_budget_guard before insert or update on storage.objects
  for each row execute function public.kivai_enforce_user_storage_budget();

-- One-time free starter allocation in the existing wallet. The grant is
-- idempotent and distinct from purchased_balance and monthly plan allowance.
alter table public.ai_credit_operations add column if not exists starter_spent integer not null default 0 check (starter_spent >= 0);
alter table public.ai_credit_operations drop constraint if exists ai_credit_operation_total_check;
alter table public.ai_credit_operations add constraint ai_credit_operation_total_check
  check (cost = free_spent + starter_spent + purchased_spent);

create table if not exists public.kivai_initial_ai_credit_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  amount integer not null default 5 check (amount between 0 and 5)
);
alter table public.kivai_initial_ai_credit_grants enable row level security;
revoke all on public.kivai_initial_ai_credit_grants from public,anon,authenticated;
grant select,insert on public.kivai_initial_ai_credit_grants to service_role;

-- Existing verified accounts also receive the one-time balance. The distinct
-- grant ledger prevents reactivation or repeated balance reads from granting
-- credits twice. Existing traffic-beta wallets are deliberately preserved.
insert into public.kivai_initial_ai_credit_grants(user_id,amount)
select u.id,5 from auth.users u where u.email_confirmed_at is not null
on conflict(user_id) do nothing;
insert into public.ai_credit_wallets(user_id,free_month,free_used,purchased_balance)
select g.user_id,date_trunc('month',timezone('America/Sao_Paulo',now()))::date,0,0
from public.kivai_initial_ai_credit_grants g
on conflict(user_id) do nothing;update public.site_contents set status='draft',indexable=false,include_in_sitemap=false,updated_at=now()
where path='/planos';

create or replace function public.get_ai_credit_balance(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  w public.ai_credit_wallets%rowtype;
  plan text := public.ai_credit_active_plan(p_user_id);
  quota integer := case plan when 'agency' then 300 when 'pro' then 100 else 0 end;
  used integer := 0;
  purchased integer := 0;
  starter integer := 0;
  free_left integer := 0;
begin
  if p_user_id is null then raise exception 'INVALID_USER'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'EMAIL_UNVERIFIED'; end if;
  insert into public.kivai_initial_ai_credit_grants(user_id) values(p_user_id) on conflict(user_id) do nothing;
  if found then insert into public.ai_credit_wallets(user_id,free_month,free_used,purchased_balance) values(p_user_id,m,0,0) on conflict(user_id) do nothing; end if;
  select * into w from public.ai_credit_wallets where user_id=p_user_id;
  if found then
    if w.free_month=m then used:=w.free_used; end if;
    purchased:=w.purchased_balance;
  end if;
  select coalesce(sum(amount),0) into starter from public.kivai_initial_ai_credit_grants where user_id=p_user_id;
  if plan='free' then free_left:=0; else free_left:=greatest(0,quota-used); end if;
  return jsonb_build_object('plan_code',plan,'free_limit',quota,'free_remaining',free_left,
    'starter_remaining',starter,'purchased_remaining',purchased,'total_remaining',free_left+purchased+starter,
    'renews_on',(m+interval '1 month')::date);
end;
$$;

create or replace function public.reserve_ai_credits(p_user_id uuid,p_operation_id uuid,p_operation_kind text,p_cost integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  w public.ai_credit_wallets%rowtype;
  prior public.ai_credit_operations%rowtype;
  m date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  plan text := public.ai_credit_active_plan(p_user_id);
  quota integer := case plan when 'agency' then 300 when 'pro' then 100 else 0 end;
  starter integer := 0;
  a integer; b integer; available integer; starter_used integer;
begin
  if p_user_id is null or p_operation_id is null or p_cost not in (1,2,5)
    or p_operation_kind not in ('insight','import') then raise exception 'INVALID_CREDIT_REQUEST'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then
    return jsonb_build_object('allowed',false,'reason','email_unverified');
  end if;
  insert into public.kivai_initial_ai_credit_grants(user_id) values(p_user_id) on conflict(user_id) do nothing;
  if found then insert into public.ai_credit_wallets(user_id,free_month,free_used,purchased_balance) values(p_user_id,m,0,0) on conflict(user_id) do nothing; end if;
  insert into public.ai_credit_wallets(user_id,free_month) values(p_user_id,m) on conflict(user_id) do nothing;
  select * into w from public.ai_credit_wallets where user_id=p_user_id for update;
  if w.free_month<>m then
    update public.ai_credit_wallets set free_month=m,free_used=0,updated_at=now() where user_id=p_user_id;
    w.free_month:=m;w.free_used:=0;
  end if;
  select * into prior from public.ai_credit_operations where id=p_operation_id;
  if found then
    if prior.user_id<>p_user_id or prior.cost<>p_cost or prior.operation_kind<>p_operation_kind then raise exception 'CREDIT_OPERATION_CONFLICT'; end if;
    return jsonb_build_object('allowed',prior.status in ('reserved','completed'),'status',prior.status);
  end if;
  select coalesce(sum(amount),0) into starter from public.kivai_initial_ai_credit_grants where user_id=p_user_id;
  available:=greatest(0,quota-w.free_used)+w.purchased_balance+starter;
  if available<p_cost then return jsonb_build_object('allowed',false,'reason','insufficient_credits',
    'free_remaining',greatest(0,quota-w.free_used),'purchased_remaining',w.purchased_balance+starter); end if;
  a:=least(p_cost,greatest(0,quota-w.free_used));
  starter_used:=least(p_cost-a,starter);
  b:=p_cost-a-starter_used;
  update public.ai_credit_wallets set free_used=free_used+a,purchased_balance=purchased_balance-b,updated_at=now() where user_id=p_user_id;
  if starter_used>0 then update public.kivai_initial_ai_credit_grants set amount=amount-starter_used where user_id=p_user_id; end if;
  insert into public.ai_credit_operations(id,user_id,cost,free_spent,starter_spent,purchased_spent,operation_kind)
    values(p_operation_id,p_user_id,p_cost,a,starter_used,b,p_operation_kind);
  return jsonb_build_object('allowed',true,'status','reserved');
end;
$$;

create or replace function public.finalize_ai_credits(p_user_id uuid,p_operation_id uuid,p_success boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare op public.ai_credit_operations%rowtype; m date:=date_trunc('month',timezone('America/Sao_Paulo',now()))::date;
begin
  if p_user_id is null or p_operation_id is null or p_success is null then return false; end if;
  select * into op from public.ai_credit_operations where id=p_operation_id and user_id=p_user_id for update;
  if not found then return false; end if;
  if op.status<>'reserved' then return op.status=case when p_success then 'completed' else 'refunded' end; end if;
  if not p_success then
    update public.ai_credit_wallets set
      free_used=case when free_month=date_trunc('month',timezone('America/Sao_Paulo',op.created_at))::date then greatest(0,free_used-op.free_spent) else free_used end,
      purchased_balance=purchased_balance+op.purchased_spent,updated_at=now()
    where user_id=p_user_id;
    if op.starter_spent>0 then
      update public.kivai_initial_ai_credit_grants set amount=least(5,amount+op.starter_spent) where user_id=p_user_id;
    end if;
  end if;
  update public.ai_credit_operations set status=case when p_success then 'completed' else 'refunded' end,updated_at=now() where id=p_operation_id;
  return true;
end;
$$;

-- Prevent monthly free allocations from accumulating; purchased credits are
-- unaffected. Paid recurring entitlements remain active during their period.
revoke all on function public.get_ai_credit_balance(uuid) from public,anon,authenticated;
revoke all on function public.reserve_ai_credits(uuid,uuid,text,integer) from public,anon,authenticated;
revoke all on function public.finalize_ai_credits(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.get_ai_credit_balance(uuid) to service_role;
grant execute on function public.reserve_ai_credits(uuid,uuid,text,integer) to service_role;
grant execute on function public.finalize_ai_credits(uuid,uuid,boolean) to service_role;

-- Minimal inventory metadata for the admin storage screen; never returns user
-- project payloads or secrets.
create or replace function public.kivai_admin_saved_projects()
returns table(id uuid,user_id uuid,kind text,title text,updated_at timestamptz,bytes bigint)
language sql stable security invoker set search_path='' as $$
  select p.id,p.user_id,p.kind,p.title,p.updated_at,pg_column_size(p.payload)::bigint
  from public.saved_tool_projects p order by p.updated_at desc limit 1000;
$$;
revoke all on function public.kivai_admin_saved_projects() from public,anon,authenticated;
grant execute on function public.kivai_admin_saved_projects() to service_role;
